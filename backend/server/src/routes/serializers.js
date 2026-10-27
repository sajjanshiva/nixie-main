// Converts database rows into API responses. Only the fields listed here are
// ever sent, so password hashes, tokens and internal fields can't leak.
const env = require("../config/env");
const { invoiceLabel } = require("../lib/format");
const { halfNow } = require("../lib/gst");

function publicCustomer(c) {
  return {
    id: c.id,
    email: c.email,
    name: c.name,
    phone: c.phone,
    addressLine: c.address_line,
    city: c.city,
    state: c.state,
    pincode: c.pincode,
    hasPassword: Boolean(c.password_hash),
    hasGoogle: Boolean(c.google_sub),
  };
}

function analysis(a) {
  return {
    id: a.id,
    imageUrl: a.image_url,
    outfitType: a.outfit_type,
    primaryFabric: a.primary_fabric,
    secondaryFabrics: a.secondary_fabrics || [],
    aiComment: a.ai_comment,
    estimatedPrice: a.estimated_price_rupees, // rupees (whole number)
    createdAt: a.created_at,
  };
}

function lead(l) {
  return {
    id: l.id,
    type: l.type, // 'ai_analysis' | 'general'
    name: l.name,
    phone: l.phone,
    email: l.email,
    addressLine: l.address_line,
    city: l.city,
    state: l.state,
    pincode: l.pincode,
    message: l.message,
    photoUrl: l.photo_url,
    analysis: l.type === "ai_analysis"
      ? {
          id: l.analysis_id,
          imageUrl: l.analysis_image_url,
          outfitType: l.outfit_type,
          primaryFabric: l.primary_fabric,
          secondaryFabrics: l.secondary_fabrics || [],
          estimatedPrice: l.estimated_price_rupees,
        }
      : null,
    galleryImage: l.gallery_image_url
      ? { id: l.gallery_image_id, title: l.gallery_title, imageUrl: l.gallery_image_url, slug: l.gallery_slug || null }
      : null,
    createdAt: l.created_at,
  };
}

function galleryImage(g) {
  return {
    id: g.id,
    slug: g.slug,
    title: g.title,
    description: g.description,
    tags: g.tags || [],
    imageUrl: g.image_url,
    width: g.width,
    height: g.height,
    createdAt: g.created_at,
  };
}

function invoiceItem(it) {
  return {
    id: it.id,
    name: it.name,
    unitPricePaise: it.unit_price_paise,
    quantity: it.quantity,
    gstRate: it.gst_rate,
    gstAuto: it.gst_auto,
    basePaise: it.base_paise,
    discountPaise: it.discount_paise,
    taxablePaise: it.taxable_paise,
    gstPaise: it.gst_paise,
  };
}

function discountOf(inv) {
  if (!inv.discount_type) return null;
  return {
    type: inv.discount_type,
    amountPaise: inv.discount_type === "amount" ? inv.discount_input_paise : null,
    percent: inv.discount_type === "percent" ? Number(inv.discount_percent) : null,
    reason: inv.discount_reason,
  };
}

function totalsOf(inv) {
  return {
    subtotalPaise: inv.subtotal_paise,
    discountPaise: inv.discount_paise,
    gstPaise: inv.gst_paise,
    shippingPaise: inv.shipping_paise,
    totalPaise: inv.total_paise,
    paidPaise: inv.paid_paise,
    balancePaise: inv.total_paise - inv.paid_paise,
  };
}

const payUrl = (inv) => `${env.FRONTEND_URL}/pay/${inv.token}`;

/** Full invoice for the admin panel. */
function adminInvoice(inv, items = [], payments = []) {
  return {
    id: inv.id,
    number: inv.number,
    label: invoiceLabel(inv.number), // "NX-0013" (null while draft)
    status: inv.status,
    customer: { name: inv.customer_name, email: inv.customer_email, phone: inv.customer_phone },
    items: items.map(invoiceItem),
    discount: discountOf(inv),
    shipping: inv.shipping_name ? { name: inv.shipping_name, pricePaise: inv.shipping_paise } : null,
    totals: totalsOf(inv),
    internalNote: inv.internal_note,
    email: { to: inv.email_to, subject: inv.email_subject, message: inv.email_message },
    billing: {
      name: inv.billing_name,
      phone: inv.billing_phone,
      addressLine: inv.billing_address_line,
      city: inv.billing_city,
      state: inv.billing_state,
      pincode: inv.billing_pincode,
    },
    payUrl: inv.status === "draft" ? null : payUrl(inv),
    payments: payments.map((p) => ({
      id: p.id,
      kind: p.kind,
      method: p.method,
      status: p.status,
      amountPaise: p.amount_paise,
      note: p.note,
      createdAt: p.created_at,
      paidAt: p.paid_at,
    })),
    sentAt: inv.sent_at,
    paidAt: inv.paid_at,
    cancelledAt: inv.cancelled_at,
    createdAt: inv.created_at,
    updatedAt: inv.updated_at,
  };
}

/** Row for the admin invoice list. */
function adminInvoiceRow(inv) {
  return {
    id: inv.id,
    label: invoiceLabel(inv.number),
    status: inv.status,
    customerName: inv.customer_name,
    customerEmail: inv.customer_email,
    totalPaise: inv.total_paise,
    paidPaise: inv.paid_paise,
    createdAt: inv.created_at,
    sentAt: inv.sent_at,
  };
}

/**
 * Invoice as the CUSTOMER sees it on /pay/<token> and in their profile.
 * No internal note, no admin fields. Pay options are calculated by the server.
 */
function publicInvoice(inv, items = []) {
  const base = { label: invoiceLabel(inv.number), status: inv.status, token: inv.token };
  if (inv.status === "cancelled") return base; // "This invoice is no longer valid."

  const balance = inv.total_paise - inv.paid_paise;
  let payOptions = null;
  if (inv.status === "sent") payOptions = { fullPaise: inv.total_paise, halfPaise: halfNow(inv.total_paise) };
  else if (inv.status === "partially_paid") payOptions = { balancePaise: balance };

  return {
    ...base,
    customer: { name: inv.customer_name, email: inv.customer_email, phone: inv.customer_phone },
    billing: {
      name: inv.billing_name,
      phone: inv.billing_phone,
      addressLine: inv.billing_address_line,
      city: inv.billing_city,
      state: inv.billing_state,
      pincode: inv.billing_pincode,
    },
    items: items.map((it) => ({
      name: it.name,
      quantity: it.quantity,
      unitPricePaise: it.unit_price_paise,
      linePaise: it.base_paise,
    })),
    discount: inv.discount_paise > 0 ? { amountPaise: inv.discount_paise, reason: inv.discount_reason } : null,
    shipping: inv.shipping_name ? { name: inv.shipping_name, pricePaise: inv.shipping_paise } : null,
    totals: totalsOf(inv),
    payOptions,
    sentAt: inv.sent_at,
    paidAt: inv.paid_at,
  };
}

module.exports = {
  publicCustomer,
  analysis,
  lead,
  galleryImage,
  adminInvoice,
  adminInvoiceRow,
  publicInvoice,
};

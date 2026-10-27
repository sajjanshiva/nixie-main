// Admin invoices (modelled on Shopify draft orders → send invoice).
// Rules: drafts can be edited/deleted; sent invoices are never edited
// (cancel + duplicate instead); numbers NX-0001… are assigned when SENT.
const express = require("express");
const { query, withTransaction } = require("../../db/pool");
const { ah, AppError, notFound } = require("../../lib/errors");
const { parse } = require("../../middleware/validate");
const { z, uuid, email, phone, optionalText } = require("../../lib/validators");
const { getPaging } = require("../../lib/pagination");
const { calculateInvoice } = require("../../lib/gst");
const { randomToken } = require("../../lib/crypto");
const { invoiceLabel, parseInvoiceNumber } = require("../../lib/format");
const { paiseToDecimal } = require("../../lib/money");
const { toCsv } = require("../../lib/csv");
const STATES = require("../../config/indianStates");
const { sendEmail, fromLabel } = require("../../services/email");
const templates = require("../../services/emailTemplates");
const env = require("../../config/env");
const C = require("../../config/constants");
const ser = require("../serializers");

const router = express.Router();

// ------------------------------------------------------------------ schemas
const paise = z.number().int("Amount must be in paise (whole number)").min(0).max(1_000_000_000);

const itemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required").max(200),
  unitPricePaise: paise,
  quantity: z.number().int().min(1).max(999),
  gstRate: z.union([z.literal(5), z.literal(18)]).nullable().optional(), // null = automatic
});

const discountSchema = z
  .object({
    type: z.enum(["amount", "percent"]),
    amountPaise: paise.optional(),
    percent: z.number().min(0).max(100).optional(),
    reason: optionalText(200),
  })
  .refine((d) => (d.type === "amount" ? d.amountPaise !== undefined : d.percent !== undefined), {
    message: "Enter a discount value",
    path: ["value"],
  });

const shippingSchema = z.object({
  name: z.string().trim().min(1, "Shipping name is required").max(100),
  pricePaise: paise,
});

const calcSchema = z.object({
  items: z.array(itemSchema).max(50).default([]),
  discount: discountSchema.nullable().optional(),
  shipping: shippingSchema.nullable().optional(),
});

const invoiceSchema = calcSchema.extend({
  customer: z.object({
    name: z.string().trim().min(1, "Customer name is required").max(100),
    email,
    phone: z.union([phone, z.literal("").transform(() => null), z.null()]).optional(),
  }),
  internalNote: optionalText(2000),
});

const idParam = (req) => parse(z.object({ id: uuid }), req.params).id;

// ------------------------------------------------------------------ helpers
async function loadFull(id, client = null) {
  const run = client ? client.query.bind(client) : query;
  const { rows } = await run("SELECT * FROM invoices WHERE id = $1", [id]);
  if (!rows[0]) throw notFound("Invoice not found.");
  const [{ rows: items }, { rows: payments }] = await Promise.all([
    run("SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY position", [id]),
    run("SELECT * FROM payments WHERE invoice_id = $1 ORDER BY created_at DESC", [id]),
  ]);
  return { inv: rows[0], items, payments };
}

async function lockInvoice(client, id) {
  const { rows } = await client.query("SELECT * FROM invoices WHERE id = $1 FOR UPDATE", [id]);
  if (!rows[0]) throw notFound("Invoice not found.");
  return rows[0];
}

/** Writes calculated totals + items for an invoice (draft create/update). */
async function writeTotalsAndItems(client, invoiceId, data) {
  const calc = calculateInvoice({ items: data.items, discount: data.discount, shipping: data.shipping });
  const d = data.discount || null;
  await client.query(
    `UPDATE invoices SET
        customer_name = $2, customer_email = $3, customer_phone = $4,
        discount_type = $5, discount_input_paise = $6, discount_percent = $7, discount_reason = $8,
        shipping_name = $9, shipping_paise = $10,
        subtotal_paise = $11, discount_paise = $12, gst_paise = $13, total_paise = $14,
        internal_note = $15, updated_at = now()
      WHERE id = $1`,
    [
      invoiceId,
      data.customer.name,
      data.customer.email,
      data.customer.phone || null,
      d ? d.type : null,
      d && d.type === "amount" ? d.amountPaise : null,
      d && d.type === "percent" ? d.percent : null,
      d ? d.reason : null,
      data.shipping ? data.shipping.name : null,
      calc.shippingPaise,
      calc.subtotalPaise,
      calc.discountPaise,
      calc.gstPaise,
      calc.totalPaise,
      data.internalNote || null,
    ]
  );
  await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [invoiceId]);
  for (const l of calc.lines) {
    await client.query(
      `INSERT INTO invoice_items
         (invoice_id, position, name, unit_price_paise, quantity, gst_rate, gst_auto,
          base_paise, discount_paise, taxable_paise, gst_paise)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        invoiceId,
        l.position,
        l.name,
        l.unitPricePaise,
        l.quantity,
        l.gstRate,
        l.gstAuto,
        l.basePaise,
        l.discountPaise,
        l.taxablePaise,
        l.gstPaise,
      ]
    );
  }
}

function defaultSubject(label) {
  return `Invoice ${label} from Nixie`;
}

async function sendInvoiceEmail(inv, items) {
  const label = invoiceLabel(inv.number);
  const mail = templates.invoice({
    invoice: inv,
    items,
    label,
    message: inv.email_message,
    payUrl: `${env.FRONTEND_URL}/pay/${inv.token}`,
  });
  await sendEmail({ to: inv.email_to, subject: inv.email_subject || defaultSubject(label), html: mail.html, text: mail.text });
}

// ------------------------------------------------------------------ routes

// POST /api/admin/invoices/calculate → live totals for the create page (nothing saved)
router.post(
  "/calculate",
  ah(async (req, res) => {
    const body = parse(calcSchema, req.body);
    const calc = calculateInvoice(body);
    res.json({
      lines: calc.lines.map((l) => ({
        name: l.name,
        quantity: l.quantity,
        unitPricePaise: l.unitPricePaise,
        gstRate: l.gstRate,
        gstAuto: l.gstAuto,
        suggestedRate: l.suggestedRate,
        basePaise: l.basePaise,
        discountPaise: l.discountPaise,
        taxablePaise: l.taxablePaise,
        gstPaise: l.gstPaise,
      })),
      subtotalPaise: calc.subtotalPaise,
      discountPaise: calc.discountPaise,
      gstPaise: calc.gstPaise,
      shippingPaise: calc.shippingPaise,
      totalPaise: calc.totalPaise,
    });
  })
);

// GET /api/admin/invoices/export.csv?from=YYYY-MM-DD&to=YYYY-MM-DD  (paid + partially paid)
router.get(
  "/export.csv",
  ah(async (req, res) => {
    const q = parse(
      z.object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      }),
      req.query
    );
    const { rows: invoices } = await query(
      `SELECT i.*,
              (SELECT max(paid_at) FROM payments p WHERE p.invoice_id = i.id AND p.status = 'paid') AS last_paid_at
         FROM invoices i
        WHERE i.paid_paise > 0
          AND ($1::date IS NULL OR i.sent_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Kolkata'))
          AND ($2::date IS NULL OR i.sent_at <  (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata'))
        ORDER BY i.number`,
      [q.from || null, q.to || null]
    );
    const ids = invoices.map((i) => i.id);
    const { rows: items } = ids.length
      ? await query("SELECT * FROM invoice_items WHERE invoice_id = ANY($1::uuid[])", [ids])
      : { rows: [] };

    const byRate = {};
    for (const it of items) {
      byRate[it.invoice_id] ||= { 5: { t: 0, g: 0 }, 18: { t: 0, g: 0 } };
      byRate[it.invoice_id][it.gst_rate].t += it.taxable_paise;
      byRate[it.invoice_id][it.gst_rate].g += it.gst_paise;
    }

    const fmtDate = (d) =>
      d ? new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : ""; // YYYY-MM-DD

    const headers = [
      "Invoice No", "Status", "Sent date", "Last payment date",
      "Customer name", "Customer email", "Phone",
      "Billing city", "Billing state", "Billing pincode",
      "Subtotal", "Discount", "Taxable value",
      "Taxable @5%", "GST @5%", "Taxable @18%", "GST @18%", "Total GST",
      "Shipping", "Invoice total", "Paid", "Balance",
    ];
    const rows = invoices.map((i) => {
      const r = byRate[i.id] || { 5: { t: 0, g: 0 }, 18: { t: 0, g: 0 } };
      return [
        invoiceLabel(i.number), i.status, fmtDate(i.sent_at), fmtDate(i.last_paid_at),
        i.billing_name || i.customer_name, i.customer_email, i.billing_phone || i.customer_phone || "",
        i.billing_city || "", i.billing_state || "", i.billing_pincode || "",
        paiseToDecimal(i.subtotal_paise), paiseToDecimal(i.discount_paise),
        paiseToDecimal(i.subtotal_paise - i.discount_paise),
        paiseToDecimal(r[5].t), paiseToDecimal(r[5].g), paiseToDecimal(r[18].t), paiseToDecimal(r[18].g),
        paiseToDecimal(i.gst_paise), paiseToDecimal(i.shipping_paise), paiseToDecimal(i.total_paise),
        paiseToDecimal(i.paid_paise), paiseToDecimal(i.total_paise - i.paid_paise),
      ];
    });

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="nixie-paid-invoices-${today}.csv"`);
    res.send(toCsv(headers, rows));
  })
);

// GET /api/admin/invoices/from-email → the read-only "From" shown in the send popup
router.get(
  "/from-email",
  ah(async (req, res) => {
    res.json({ from: fromLabel() });
  })
);

// GET /api/admin/invoices?status=&q=&page=&limit=
router.get(
  "/",
  ah(async (req, res) => {
    const { limit, offset, page } = getPaging(req.query, { defaultLimit: 25, maxLimit: 100 });
    const statuses = ["draft", "sent", "partially_paid", "paid", "cancelled"];
    const status = statuses.includes(req.query.status) ? req.query.status : null;
    const q = String(req.query.q || "").trim().slice(0, 100) || null;

    const where = [];
    const params = [];
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (q) {
      const num = parseInvoiceNumber(q);
      params.push(`%${q.toLowerCase().replace(/[\\%_]/g, "\\$&")}%`);
      let cond = `(lower(customer_name) LIKE $${params.length} OR customer_email LIKE $${params.length}`;
      if (num !== null) {
        params.push(num);
        cond += ` OR number = $${params.length}`;
      }
      where.push(cond + ")");
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    params.push(limit + 1, offset);
    const { rows } = await query(
      `SELECT * FROM invoices ${whereSql}
        ORDER BY COALESCE(sent_at, created_at) DESC, created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ invoices: rows.slice(0, limit).map(ser.adminInvoiceRow), hasMore: rows.length > limit, page });
  })
);

// POST /api/admin/invoices → create a draft
router.post(
  "/",
  ah(async (req, res) => {
    const body = parse(invoiceSchema, req.body);
    const id = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO invoices (token, customer_name, customer_email) VALUES ($1, $2, $3) RETURNING id`,
        [randomToken(32), body.customer.name, body.customer.email]
      );
      await writeTotalsAndItems(client, rows[0].id, body);
      return rows[0].id;
    });
    const { inv, items, payments } = await loadFull(id);
    res.status(201).json({ invoice: ser.adminInvoice(inv, items, payments) });
  })
);

// GET /api/admin/invoices/:id
router.get(
  "/:id",
  ah(async (req, res) => {
    const { inv, items, payments } = await loadFull(idParam(req));
    res.json({ invoice: ser.adminInvoice(inv, items, payments) });
  })
);

// PUT /api/admin/invoices/:id → edit a DRAFT (sent invoices can't be edited)
router.put(
  "/:id",
  ah(async (req, res) => {
    const id = idParam(req);
    const body = parse(invoiceSchema, req.body);
    await withTransaction(async (client) => {
      const inv = await lockInvoice(client, id);
      if (inv.status !== "draft") {
        throw new AppError(409, "NOT_DRAFT", "Sent invoices can't be edited. Cancel it and use Duplicate instead.");
      }
      await writeTotalsAndItems(client, id, body);
    });
    const { inv, items, payments } = await loadFull(id);
    res.json({ invoice: ser.adminInvoice(inv, items, payments) });
  })
);

// DELETE /api/admin/invoices/:id → drafts only
router.delete(
  "/:id",
  ah(async (req, res) => {
    const id = idParam(req);
    const { rows } = await query("DELETE FROM invoices WHERE id = $1 AND status = 'draft' RETURNING id", [id]);
    if (!rows[0]) throw new AppError(409, "NOT_DRAFT", "Only drafts can be deleted. Cancel a sent invoice instead.");
    res.json({ ok: true });
  })
);

const sendSchema = z.object({
  to: email,
  subject: z.string().trim().min(1).max(200).optional(),
  message: optionalText(3000),
});

// POST /api/admin/invoices/:id/email-preview { to, subject, message } → exact email HTML
router.post(
  "/:id/email-preview",
  ah(async (req, res) => {
    const id = idParam(req);
    const body = parse(sendSchema, req.body);
    const { inv, items } = await loadFull(id);
    let number = inv.number;
    if (!number) {
      const { rows } = await query("SELECT last_number + 1 AS n FROM invoice_counter WHERE id = 1");
      number = rows[0].n; // preview only; the real number is assigned on send
    }
    const label = invoiceLabel(number);
    const mail = templates.invoice({
      invoice: inv,
      items,
      label,
      message: body.message,
      payUrl: `${env.FRONTEND_URL}/pay/${inv.token}`,
    });
    res.json({ from: fromLabel(), to: body.to, subject: body.subject || defaultSubject(label), html: mail.html });
  })
);

// POST /api/admin/invoices/:id/send { to, subject?, message? } → assigns NX number, emails the customer
router.post(
  "/:id/send",
  ah(async (req, res) => {
    const id = idParam(req);
    const body = parse(sendSchema, req.body);

    const sent = await withTransaction(async (client) => {
      const inv = await lockInvoice(client, id);
      if (inv.status !== "draft") throw new AppError(409, "NOT_DRAFT", "This invoice was already sent. Use Resend.");
      const { rows: items } = await client.query("SELECT count(*)::int AS n FROM invoice_items WHERE invoice_id = $1", [id]);
      if (items[0].n === 0) throw new AppError(400, "NO_ITEMS", "Add at least one item before sending.");
      if (inv.total_paise < C.CASHFREE_MIN_PAISE) throw new AppError(400, "TOTAL_TOO_LOW", "Invoice total must be at least ₹1.");

      const { rows: counter } = await client.query(
        "UPDATE invoice_counter SET last_number = last_number + 1 WHERE id = 1 RETURNING last_number"
      );
      const number = counter[0].last_number;
      const label = invoiceLabel(number);
      const { rows } = await client.query(
        `UPDATE invoices
            SET number = $2, status = 'sent', sent_at = now(), email_to = $3, email_subject = $4,
                email_message = $5, updated_at = now()
          WHERE id = $1 RETURNING *`,
        [id, number, body.to, body.subject || defaultSubject(label), body.message]
      );
      return rows[0];
    });

    const { items, payments } = await loadFull(id);
    let emailSent = true;
    try {
      await sendInvoiceEmail(sent, items);
    } catch (err) {
      emailSent = false;
      console.error("[invoices] Email failed:", err.message);
    }
    res.json({
      invoice: ser.adminInvoice(sent, items, payments),
      emailSent,
      ...(emailSent ? {} : { warning: "Invoice saved as Sent, but the email failed. Use Resend or copy the payment link." }),
    });
  })
);

// POST /api/admin/invoices/:id/resend → same email + same link again
router.post(
  "/:id/resend",
  ah(async (req, res) => {
    const { inv, items } = await loadFull(idParam(req));
    if (!["sent", "partially_paid"].includes(inv.status)) {
      throw new AppError(409, "CANT_RESEND", "Only unpaid or partially paid invoices can be resent.");
    }
    try {
      await sendInvoiceEmail(inv, items);
    } catch (err) {
      console.error("[invoices] Resend failed:", err.message);
      throw new AppError(502, "EMAIL_FAILED", "The email couldn't be sent. Please try again.");
    }
    res.json({ ok: true });
  })
);

// POST /api/admin/invoices/:id/cancel → customer can no longer pay
router.post(
  "/:id/cancel",
  ah(async (req, res) => {
    const id = idParam(req);
    const { rows } = await query(
      `UPDATE invoices SET status = 'cancelled', cancelled_at = now(), updated_at = now()
        WHERE id = $1 AND status IN ('sent', 'partially_paid') RETURNING id`,
      [id]
    );
    if (!rows[0]) throw new AppError(409, "CANT_CANCEL", "Only unpaid or partially paid invoices can be cancelled.");
    const { inv, items, payments } = await loadFull(id);
    res.json({ invoice: ser.adminInvoice(inv, items, payments) });
  })
);

// POST /api/admin/invoices/:id/duplicate → new draft with the same customer, items, discount, shipping
router.post(
  "/:id/duplicate",
  ah(async (req, res) => {
    const { inv, items } = await loadFull(idParam(req));
    const data = {
      customer: { name: inv.customer_name, email: inv.customer_email, phone: inv.customer_phone },
      items: items.map((it) => ({
        name: it.name,
        unitPricePaise: it.unit_price_paise,
        quantity: it.quantity,
        gstRate: it.gst_auto ? null : it.gst_rate,
      })),
      discount: inv.discount_type
        ? {
            type: inv.discount_type,
            amountPaise: inv.discount_input_paise ?? undefined,
            percent: inv.discount_percent !== null ? Number(inv.discount_percent) : undefined,
            reason: inv.discount_reason,
          }
        : null,
      shipping: inv.shipping_name ? { name: inv.shipping_name, pricePaise: inv.shipping_paise } : null,
      internalNote: inv.internal_note,
    };
    const newId = await withTransaction(async (client) => {
      const { rows } = await client.query(
        "INSERT INTO invoices (token, customer_name, customer_email) VALUES ($1, $2, $3) RETURNING id",
        [randomToken(32), data.customer.name, data.customer.email]
      );
      await writeTotalsAndItems(client, rows[0].id, data);
      return rows[0].id;
    });
    const full = await loadFull(newId);
    res.status(201).json({ invoice: ser.adminInvoice(full.inv, full.items, full.payments) });
  })
);

// POST /api/admin/invoices/:id/record-payment { note?, state? }
// For money received outside the site (cash/UPI): records the remaining balance → Paid.
router.post(
  "/:id/record-payment",
  ah(async (req, res) => {
    const id = idParam(req);
    const body = parse(
      z.object({
        note: optionalText(500),
        state: z.enum(STATES).optional().nullable(), // customer's state, for the accountant (optional)
      }),
      req.body
    );
    await withTransaction(async (client) => {
      const inv = await lockInvoice(client, id);
      if (!["sent", "partially_paid"].includes(inv.status)) {
        throw new AppError(409, "CANT_RECORD", "Payments can only be recorded for unpaid or partially paid invoices.");
      }
      const balance = inv.total_paise - inv.paid_paise;
      if (balance <= 0) throw new AppError(409, "NOTHING_DUE", "Nothing is due on this invoice.");
      await client.query(
        `INSERT INTO payments (invoice_id, kind, method, status, amount_paise, note, paid_at)
         VALUES ($1, 'manual', 'manual', 'paid', $2, $3, now())`,
        [id, balance, body.note]
      );
      await client.query(
        `UPDATE invoices
            SET paid_paise = total_paise, status = 'paid', paid_at = now(), updated_at = now(),
                billing_state = COALESCE($2, billing_state)
          WHERE id = $1`,
        [id, body.state || null]
      );
    });
    const { inv, items, payments } = await loadFull(id);
    res.json({ invoice: ser.adminInvoice(inv, items, payments) });
  })
);

module.exports = router;

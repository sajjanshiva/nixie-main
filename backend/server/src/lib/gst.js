// =====================================================================
// Invoice maths — the ONLY place totals are calculated.
// Rules (decided):
//  • Admin types prices BEFORE GST; GST is added on top.
//  • Discount (₹ amount or %) is split across items by each item's share
//    of the subtotal (largest-remainder, so the paise always add up).
//  • GST slab is checked per piece AFTER the discount:
//      ≤ ₹2,500 per piece → 5%, above → 18%. Admin may override per item.
//  • Shipping is added as-is, NO GST (for now).
//  • Total = subtotal − discount + GST + shipping.
// All amounts are integers in paise.
// =====================================================================
const C = require("../config/constants");

function autoRate(perPiecePaise) {
  return perPiecePaise <= C.GST_SLAB_LIMIT_PAISE ? C.GST_LOW_RATE : C.GST_HIGH_RATE;
}

/** Splits `total` across `weights` proportionally; result always sums to `total`. */
function splitProportionally(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (total <= 0 || sum <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const floors = raw.map(Math.floor);
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; remainder > 0; k = (k + 1) % order.length, remainder--) {
    floors[order[k].i] += 1;
  }
  return floors;
}

/**
 * @param {object} input
 * @param {Array<{name:string, unitPricePaise:number, quantity:number, gstRate?:5|18|null}>} input.items
 *        gstRate null/undefined = pick automatically from the price.
 * @param {{type:'amount'|'percent', amountPaise?:number, percent?:number, reason?:string}|null} input.discount
 * @param {{name:string, pricePaise:number}|null} input.shipping
 */
function calculateInvoice({ items = [], discount = null, shipping = null }) {
  const lines = items.map((it, index) => ({
    position: index,
    name: it.name,
    unitPricePaise: it.unitPricePaise,
    quantity: it.quantity,
    requestedRate: it.gstRate == null ? null : Number(it.gstRate),
    basePaise: it.unitPricePaise * it.quantity,
  }));

  const subtotalPaise = lines.reduce((s, l) => s + l.basePaise, 0);

  let discountPaise = 0;
  if (discount && subtotalPaise > 0) {
    if (discount.type === "amount") {
      discountPaise = Math.min(Math.max(0, Math.round(discount.amountPaise || 0)), subtotalPaise);
    } else if (discount.type === "percent") {
      const basisPoints = Math.round((discount.percent || 0) * 100); // 7.5% → 750
      discountPaise = Math.min(Math.round((subtotalPaise * basisPoints) / 10000), subtotalPaise);
    }
  }

  const shares = splitProportionally(discountPaise, lines.map((l) => l.basePaise));

  let gstPaise = 0;
  const breakdown = {};
  for (const rate of C.GST_RATES) breakdown[rate] = { taxablePaise: 0, gstPaise: 0 };

  const outLines = lines.map((l, i) => {
    const lineDiscount = shares[i];
    const taxable = l.basePaise - lineDiscount;
    const perPiece = l.quantity > 0 ? taxable / l.quantity : 0;
    const rate = l.requestedRate ?? autoRate(perPiece);
    const lineGst = Math.round((taxable * rate) / 100);
    gstPaise += lineGst;
    breakdown[rate].taxablePaise += taxable;
    breakdown[rate].gstPaise += lineGst;
    return {
      position: l.position,
      name: l.name,
      unitPricePaise: l.unitPricePaise,
      quantity: l.quantity,
      gstRate: rate,
      gstAuto: l.requestedRate == null,
      suggestedRate: autoRate(perPiece),
      basePaise: l.basePaise,
      discountPaise: lineDiscount,
      taxablePaise: taxable,
      gstPaise: lineGst,
    };
  });

  const shippingPaise = shipping ? Math.max(0, Math.round(shipping.pricePaise || 0)) : 0;
  // Shipping GST is OFF for now (constants.SHIPPING_HAS_GST). Flip the switch to turn it on.
  if (C.SHIPPING_HAS_GST && shippingPaise > 0) {
    const shippingGst = Math.round((shippingPaise * C.SHIPPING_GST_RATE) / 100);
    gstPaise += shippingGst;
    if (breakdown[C.SHIPPING_GST_RATE]) {
      breakdown[C.SHIPPING_GST_RATE].taxablePaise += shippingPaise;
      breakdown[C.SHIPPING_GST_RATE].gstPaise += shippingGst;
    }
  }
  const totalPaise = subtotalPaise - discountPaise + gstPaise + shippingPaise;

  return {
    lines: outLines,
    subtotalPaise,
    discountPaise,
    gstPaise,
    shippingPaise,
    totalPaise,
    gstBreakdown: breakdown,
  };
}

/** First half rounds UP (to the paisa); the balance gets the rest. */
function halfNow(totalPaise) {
  return Math.ceil(totalPaise / 2);
}

module.exports = { calculateInvoice, halfNow, autoRate, splitProportionally };

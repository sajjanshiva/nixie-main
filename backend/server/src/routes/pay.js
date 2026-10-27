// Customer checkout for invoices (no login needed; the link has a long random token).
// The server checks the invoice status when the page opens AND when Pay is clicked,
// calculates the amount itself, and locks the invoice row while creating the order.
const express = require("express");
const { query, withTransaction } = require("../db/pool");
const { ah, AppError, notFound } = require("../lib/errors");
const { parse } = require("../middleware/validate");
const { z, token, name, phone, address } = require("../lib/validators");
const { payLimiter } = require("../middleware/rateLimits");
const { halfNow } = require("../lib/gst");
const { randomHex } = require("../lib/crypto");
const cashfree = require("../services/cashfree");
const { syncPayment } = require("../services/payments");
const env = require("../config/env");
const C = require("../config/constants");
const ser = require("./serializers");

const router = express.Router();

async function loadInvoice(tokenValue, client = null) {
  const run = client ? client.query.bind(client) : query;
  const { rows } = await run(`SELECT * FROM invoices WHERE token = $1${client ? " FOR UPDATE" : ""}`, [tokenValue]);
  const inv = rows[0];
  if (!inv || inv.status === "draft") throw notFound("This invoice link is not valid.");
  return inv;
}

async function loadItems(invoiceId) {
  const { rows } = await query("SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY position", [invoiceId]);
  return rows;
}

// GET /api/pay/:token → invoice for the checkout page
router.get(
  "/:token",
  ah(async (req, res) => {
    const { token: t } = parse(z.object({ token }), req.params);
    const inv = await loadInvoice(t);
    res.json({ invoice: ser.publicInvoice(inv, await loadItems(inv.id)) });
  })
);

const orderSchema = z.object({
  option: z.enum(["full", "half", "balance"]),
  name,
  phone, // Cashfree needs a phone number
  ...address,
});

// POST /api/pay/:token/orders → creates a Cashfree order and returns the payment session id
router.post(
  "/:token/orders",
  payLimiter,
  ah(async (req, res) => {
    const { token: t } = parse(z.object({ token }), req.params);
    const body = parse(orderSchema, req.body);

    const result = await withTransaction(async (client) => {
      const inv = await loadInvoice(t, client); // row locked until commit

      if (inv.status === "cancelled") throw new AppError(409, "INVOICE_CANCELLED", "This invoice is no longer valid.");
      if (inv.status === "paid") throw new AppError(409, "INVOICE_PAID", "This invoice is already paid.");

      const balance = inv.total_paise - inv.paid_paise;
      let amount;
      let kind;
      if (inv.status === "sent" && inv.paid_paise === 0) {
        if (body.option === "full") [amount, kind] = [inv.total_paise, "full"];
        else if (body.option === "half") [amount, kind] = [halfNow(inv.total_paise), "half"];
        else throw new AppError(400, "BAD_OPTION", "Please choose how you want to pay.");
      } else {
        // Partially paid: only the remaining balance can be paid.
        if (body.option !== "balance") throw new AppError(409, "BALANCE_ONLY", "Only the remaining balance can be paid now.");
        [amount, kind] = [balance, "balance"];
      }
      if (amount < C.CASHFREE_MIN_PAISE) throw new AppError(400, "AMOUNT_TOO_LOW", "Amount is too low to pay online.");

      // Save the checkout details (state is kept for the accountant's GST export).
      await client.query(
        `UPDATE invoices
            SET billing_name = $2, billing_phone = $3, billing_address_line = $4, billing_city = $5,
                billing_state = $6, billing_pincode = $7, customer_phone = COALESCE(customer_phone, $3),
                updated_at = now()
          WHERE id = $1`,
        [inv.id, body.name, body.phone, body.addressLine, body.city, body.state, body.pincode]
      );

      const orderId = `NX${String(inv.number).padStart(4, "0")}_${randomHex(6)}`;
      await client.query(
        `INSERT INTO payments (invoice_id, kind, method, status, amount_paise, cf_order_id)
         VALUES ($1, $2, 'cashfree', 'pending', $3, $4)`,
        [inv.id, kind, amount, orderId]
      );

      let order;
      try {
        order = await cashfree.createOrder({
          orderId,
          amountPaise: amount,
          customer: {
            id: `nx_${inv.id.replace(/-/g, "")}`,
            name: body.name,
            email: inv.customer_email,
            phone: body.phone,
          },
          returnUrl: `${env.FRONTEND_URL}/pay/${inv.token}?order_id={order_id}`,
          note: `Invoice ${C.INVOICE_PREFIX}${String(inv.number).padStart(4, "0")}`,
        });
      } catch (err) {
        console.error("[pay] Cashfree order failed:", err.message);
        throw new AppError(502, "PAYMENT_START_FAILED", "Couldn't start the payment. Please try again.");
      }
      return { orderId, paymentSessionId: order.payment_session_id, amountPaise: amount };
    });

    res.status(201).json({ ...result, cashfreeMode: env.CASHFREE_ENV });
  })
);

// GET /api/pay/:token/orders/:orderId → called when the customer comes back from Cashfree.
// Returns 'paid' | 'pending' | 'failed' plus the updated invoice.
router.get(
  "/:token/orders/:orderId",
  ah(async (req, res) => {
    const params = parse(
      z.object({ token, orderId: z.string().regex(/^[A-Za-z0-9_-]{1,45}$/, "Invalid order") }),
      req.params
    );
    const inv = await loadInvoice(params.token);
    const { rows } = await query("SELECT id FROM payments WHERE cf_order_id = $1 AND invoice_id = $2", [
      params.orderId,
      inv.id,
    ]);
    if (!rows[0]) throw notFound("Payment not found.");

    const result = await syncPayment(params.orderId);
    const fresh = await loadInvoice(params.token);
    res.json({ result, invoice: ser.publicInvoice(fresh, await loadItems(fresh.id)) });
  })
);

module.exports = router;

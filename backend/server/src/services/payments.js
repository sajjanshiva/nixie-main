// =====================================================================
// Confirming Cashfree payments. Called from:
//   • the webhook (Cashfree → us),
//   • the payment-status check when the customer returns to /pay/<token>,
//   • the cleanup job for old "pending" payments.
// It always asks Cashfree's API for the real status (never trusts the caller),
// and records each payment ONLY ONCE (row lock + status check), so duplicate
// webhooks or two tabs can't double-count money.
// =====================================================================
const { query, withTransaction } = require("../db/pool");
const cashfree = require("./cashfree");
const { sendEmail } = require("./email");
const templates = require("./emailTemplates");
const env = require("../config/env");
const { invoiceLabel } = require("../lib/format");

/** @returns {'paid'|'pending'|'failed'|null} null = unknown order id */
async function syncPayment(cfOrderId) {
  const { rows } = await query("SELECT id, status FROM payments WHERE cf_order_id = $1", [cfOrderId]);
  const payment = rows[0];
  if (!payment) return null;
  if (payment.status !== "pending") return payment.status;

  let order;
  try {
    order = await cashfree.getOrder(cfOrderId);
  } catch (err) {
    console.error(`[payments] Could not fetch order ${cfOrderId}: ${err.message}`);
    return "pending";
  }

  if (order.order_status === "PAID") {
    await recordPaid(payment.id, order);
    return "paid";
  }

  if (["EXPIRED", "TERMINATED", "TERMINATION_REQUESTED"].includes(order.order_status)) {
    await query("UPDATE payments SET status = 'failed' WHERE id = $1 AND status = 'pending'", [payment.id]);
    return "failed";
  }

  // Still ACTIVE: check whether the customer's last attempt failed or was cancelled.
  try {
    const attempts = await cashfree.getOrderPayments(cfOrderId);
    if (Array.isArray(attempts) && attempts.length) {
      const latest = attempts
        .slice()
        .sort((a, b) => new Date(b.payment_time || 0) - new Date(a.payment_time || 0))[0];
      if (["FAILED", "USER_DROPPED", "CANCELLED"].includes(latest.payment_status)) return "failed";
    }
  } catch (_) {
    /* ignore — treat as pending */
  }
  return "pending";
}

async function recordPaid(paymentId, order) {
  const result = await withTransaction(async (client) => {
    const { rows: pRows } = await client.query("SELECT * FROM payments WHERE id = $1 FOR UPDATE", [paymentId]);
    const payment = pRows[0];
    if (!payment || payment.status === "paid") return null; // already recorded

    const paidPaise = Math.round(Number(order.order_amount) * 100);
    if (paidPaise !== payment.amount_paise) {
      // Should never happen (amount is set by us). Log loudly and don't record.
      console.error(
        `[payments] Amount mismatch for ${payment.cf_order_id}: expected ${payment.amount_paise}, Cashfree says ${paidPaise}`
      );
      return null;
    }

    await client.query("UPDATE payments SET status = 'paid', paid_at = now() WHERE id = $1", [payment.id]);

    const { rows: iRows } = await client.query("SELECT * FROM invoices WHERE id = $1 FOR UPDATE", [
      payment.invoice_id,
    ]);
    const inv = iRows[0];
    const newPaid = inv.paid_paise + payment.amount_paise;
    // Money received always wins: even if admin cancelled meanwhile, the invoice
    // reflects what was actually paid, so admin can see it and refund manually.
    const newStatus = newPaid >= inv.total_paise ? "paid" : "partially_paid";
    const { rows: updated } = await client.query(
      `UPDATE invoices
          SET paid_paise = $2, status = $3, updated_at = now(),
              paid_at = CASE WHEN $3 = 'paid' THEN now() ELSE paid_at END
        WHERE id = $1
      RETURNING *`,
      [inv.id, newPaid, newStatus]
    );
    if (inv.status === "cancelled") {
      console.warn(`[payments] Payment received for CANCELLED invoice ${invoiceLabel(inv.number)}.`);
    }
    return { invoice: updated[0], amountPaise: payment.amount_paise };
  });

  if (result) {
    // Email after commit; an email failure never undoes a recorded payment.
    try {
      const inv = result.invoice;
      const label = invoiceLabel(inv.number);
      const mail = templates.paymentConfirmation({
        invoice: inv,
        label,
        amountPaise: result.amountPaise,
        payUrl: `${env.FRONTEND_URL}/pay/${inv.token}`,
      });
      await sendEmail({ to: inv.email_to || inv.customer_email, ...mail });
    } catch (err) {
      console.error(`[payments] Confirmation email failed: ${err.message}`);
    }
  }
}

module.exports = { syncPayment };

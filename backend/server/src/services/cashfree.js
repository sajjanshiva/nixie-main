// Cashfree Payment Gateway (PG) REST API, called directly with fetch.
// The secret key is used only here, on the server.
// Docs: https://www.cashfree.com/docs/api-reference/payments/latest/orders/create
const crypto = require("crypto");
const env = require("../config/env");

const BASE_URL =
  env.CASHFREE_ENV === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";

async function request(method, path, body) {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-client-id": env.CASHFREE_APP_ID,
      "x-client-secret": env.CASHFREE_SECRET_KEY,
      "x-api-version": env.CASHFREE_API_VERSION,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`Cashfree ${method} ${path} failed (${res.status}): ${data.message || "unknown error"}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Creates a Cashfree order. amountPaise is calculated by OUR server, never the browser.
 * Returns { payment_session_id, order_id, ... }.
 */
async function createOrder({ orderId, amountPaise, customer, returnUrl, note }) {
  const notifyUrl = `${env.BACKEND_PUBLIC_URL}/api/payments/webhook`;
  const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour to finish paying
  return request("POST", "/orders", {
    order_id: orderId,
    order_amount: Number((amountPaise / 100).toFixed(2)),
    order_currency: "INR",
    customer_details: {
      customer_id: customer.id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
    },
    order_meta: {
      return_url: returnUrl,
      // Cashfree requires an https webhook URL; skipped for local http testing.
      ...(notifyUrl.startsWith("https://") ? { notify_url: notifyUrl } : {}),
    },
    order_expiry_time: expiry,
    order_note: note ? String(note).slice(0, 200) : undefined,
  });
}

/** order_status: ACTIVE | PAID | EXPIRED | TERMINATED | TERMINATION_REQUESTED */
async function getOrder(orderId) {
  return request("GET", `/orders/${encodeURIComponent(orderId)}`);
}

/** Payment attempts for an order (used to show "payment failed" after a failed try). */
async function getOrderPayments(orderId) {
  return request("GET", `/orders/${encodeURIComponent(orderId)}/payments`);
}

/**
 * Webhook signature = base64( HMAC-SHA256( timestamp + rawBody, secretKey ) ).
 * Rejects fake "payment done" calls.
 */
function verifyWebhookSignature(rawBody, timestamp, signature) {
  if (!rawBody || !timestamp || !signature) return false;
  const expected = crypto
    .createHmac("sha256", env.CASHFREE_SECRET_KEY)
    .update(String(timestamp) + rawBody)
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { createOrder, getOrder, getOrderPayments, verifyWebhookSignature };

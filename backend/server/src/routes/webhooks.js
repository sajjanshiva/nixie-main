// Cashfree webhook. Needs the RAW body to verify the signature, so it is
// mounted in app.js BEFORE express.json().
const express = require("express");
const cashfree = require("../services/cashfree");
const { syncPayment } = require("../services/payments");

const router = express.Router();

router.post("/", express.raw({ type: "*/*", limit: "1mb" }), async (req, res) => {
  const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  const ok = cashfree.verifyWebhookSignature(
    raw,
    req.get("x-webhook-timestamp"),
    req.get("x-webhook-signature")
  );
  if (!ok) return res.status(401).json({ error: { code: "BAD_SIGNATURE", message: "Invalid signature." } });

  try {
    const payload = JSON.parse(raw);
    const orderId = payload?.data?.order?.order_id;
    // syncPayment asks Cashfree's API for the real status and records it only once.
    if (orderId) await syncPayment(String(orderId));
  } catch (err) {
    console.error("[webhook] Processing failed:", err.message);
    return res.status(500).json({ ok: false }); // Cashfree will retry
  }
  res.json({ ok: true });
});

module.exports = router;

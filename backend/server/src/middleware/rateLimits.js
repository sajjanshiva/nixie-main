// In-memory limits for bursts. The important business limits (guest analyses,
// OTPs, resets, contact form, admin lockout) are counted in the DATABASE so
// they survive server restarts (Render free tier sleeps and restarts).
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const C = require("../config/constants");

function jsonHandler(message) {
  return (req, res) => {
    res.status(429).json({ error: { code: "RATE_LIMITED", message } });
  };
}

const ipKey = (req) => ipKeyGenerator(req.ip || "unknown");

/** ~100 requests per minute per IP for every API. */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: ipKey,
  handler: jsonHandler("Too many requests. Please slow down and try again in a minute."),
});

/** Customer login: 10 wrong tries per 15 minutes (per IP + email). */
const customerLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: C.CUSTOMER_LOGIN_MAX_FAILED,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKey(req)}|${String(req.body?.email || "").toLowerCase()}`,
  handler: jsonHandler("Too many wrong tries. Please wait 15 minutes and try again."),
});

/** General auth endpoints (signup, google, forgot, reset): burst protection per IP. */
const authBurstLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: ipKey,
  handler: jsonHandler("Too many attempts. Please wait a few minutes and try again."),
});

/** Uploads to Gemini: short burst protection per IP (real limits are in the DB). */
const analysisBurstLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 6,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: ipKey,
  handler: jsonHandler("Too many uploads at once. Please wait a minute."),
});

/** Creating payment orders. */
const payLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: ipKey,
  handler: jsonHandler("Too many payment attempts. Please wait a few minutes."),
});

module.exports = { globalLimiter, customerLoginLimiter, authBurstLimiter, analysisBurstLimiter, payLimiter };

// All fixed business rules in ONE place. Change a number here, not in the routes.

module.exports = {
  // Login sessions
  CUSTOMER_COOKIE: "nixie_customer",
  ADMIN_COOKIE: "nixie_admin",
  CUSTOMER_SESSION_DAYS: 30,
  ADMIN_SESSION_HOURS: 24,

  // Passwords
  CUSTOMER_PASSWORD_MIN: 8,
  ADMIN_PASSWORD_MIN: 12,
  PASSWORD_MAX: 72, // bcrypt only uses the first 72 bytes
  BCRYPT_ROUNDS: 12,

  // Signup OTP
  OTP_TTL_MINUTES: 10,
  OTP_MAX_ATTEMPTS: 5,
  OTP_RESEND_SECONDS: 60,
  OTP_MAX_PER_HOUR: 5,

  // Password reset
  RESET_TTL_MINUTES: 30,
  RESET_MAX_PER_HOUR: 3,

  // Admin lockout
  ADMIN_MAX_FAILED: 5,
  ADMIN_LOCK_MINUTES: 15,

  // Customer login: wrong tries per 15 minutes
  CUSTOMER_LOGIN_MAX_FAILED: 10,

  // AI analysis limits
  GUEST_ANALYSES_PER_DAY: 3,
  USER_ANALYSES_PER_HOUR: 15,
  GUEST_ANALYSIS_RETENTION_DAYS: 7,

  // Contact form
  LEADS_PER_HOUR: 5,

  // Uploads
  MAX_UPLOAD_MB: 10,
  MAX_GALLERY_BATCH: 10,

  // GST (fixed in code by decision). Prices typed by admin are BEFORE GST.
  GST_SLAB_LIMIT_PAISE: 2500 * 100, // up to ₹2,500 per piece → low rate
  GST_LOW_RATE: 5,
  GST_HIGH_RATE: 18,
  GST_RATES: [5, 18],
  SHIPPING_HAS_GST: false, // decided: no GST on shipping for now
  SHIPPING_GST_RATE: 18, // only used if SHIPPING_HAS_GST is switched to true

  // Pricing (AI estimate)
  SECONDARY_FABRIC_DAMPING: 0.35,
  BRACKET_FRACTION: 0.8, // price = 80% of the way through the bracket

  // Invoices
  INVOICE_PREFIX: "NX-",
  CASHFREE_MIN_PAISE: 100, // Cashfree minimum order is ₹1
};

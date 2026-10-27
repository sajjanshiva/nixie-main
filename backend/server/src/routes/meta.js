// Public settings the frontend needs (single source of truth).
const express = require("express");
const env = require("../config/env");
const C = require("../config/constants");
const STATES = require("../config/indianStates");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    contactEmail: env.CONTACT_EMAIL,
    contactPhone: env.CONTACT_PHONE,
    instagramUrl: env.INSTAGRAM_URL,
    googleClientId: env.GOOGLE_CLIENT_ID,
    cashfreeMode: env.CASHFREE_ENV, // "sandbox" | "production" for the Cashfree JS SDK
    states: STATES,
    limits: {
      guestAnalysesPerDay: C.GUEST_ANALYSES_PER_DAY,
      userAnalysesPerHour: C.USER_ANALYSES_PER_HOUR,
      maxUploadMb: C.MAX_UPLOAD_MB,
      maxGalleryBatch: C.MAX_GALLERY_BATCH,
      customerPasswordMin: C.CUSTOMER_PASSWORD_MIN,
      adminPasswordMin: C.ADMIN_PASSWORD_MIN,
      otpResendSeconds: C.OTP_RESEND_SECONDS,
    },
    gst: {
      slabLimitPaise: C.GST_SLAB_LIMIT_PAISE,
      lowRate: C.GST_LOW_RATE,
      highRate: C.GST_HIGH_RATE,
      rates: C.GST_RATES,
    },
  });
});

module.exports = router;

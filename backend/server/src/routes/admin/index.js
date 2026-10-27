// /api/admin/* — every route except login/forgot/reset requires the admin cookie.
const express = require("express");
const { requireAdmin } = require("../../middleware/auth");

const router = express.Router();

// Admin responses must never be cached.
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("X-Robots-Tag", "noindex, nofollow");
  next();
});

router.use("/auth", require("./auth")); // login, logout, forgot, reset (me is protected inside)
router.use(requireAdmin); // ← everything below needs an admin session
router.use("/dashboard", require("./dashboard"));
router.use("/leads", require("./leads"));
router.use("/invoices", require("./invoices"));
router.use("/gallery", require("./gallery"));

module.exports = router;

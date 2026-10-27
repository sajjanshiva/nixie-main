const crypto = require("crypto");
const env = require("../config/env");

/** Long random URL-safe token (sessions, reset links, invoice links). */
function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Keyed hash for storing tokens/OTPs/IPs. The raw value is never stored. */
function hashToken(value) {
  return crypto.createHmac("sha256", env.SESSION_SECRET).update(String(value)).digest("hex");
}

/** 6-digit OTP from a secure random source (not Math.random). */
function randomOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function randomHex(bytes = 4) {
  return crypto.randomBytes(bytes).toString("hex");
}

module.exports = { randomToken, hashToken, randomOtp, safeEqual, randomHex };

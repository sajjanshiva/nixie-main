// CSRF protection: any request that changes data must come from our own site.
// Browsers always send an Origin header on cross-site POST/PUT/PATCH/DELETE,
// so a request from another website is rejected here.
const env = require("../config/env");
const { AppError } = require("../lib/errors");

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

function originCheck(req, res, next) {
  if (SAFE.has(req.method)) return next();
  const origin = req.get("origin");
  if (origin && !env.allowedOrigins.includes(origin)) {
    return next(new AppError(403, "BAD_ORIGIN", "Request blocked."));
  }
  next();
}

module.exports = { originCheck };

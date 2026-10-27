const { AppError } = require("../lib/errors");
const sessions = require("../services/sessions");

/** Attaches req.customer if a valid customer cookie is present (never blocks). */
async function loadCustomer(req, res, next) {
  try {
    const token = req.cookies?.[sessions.COOKIE.customer];
    if (token) req.customer = await sessions.findCustomerBySession(token);
    next();
  } catch (err) {
    next(err);
  }
}

function requireCustomer(req, res, next) {
  if (!req.customer) return next(new AppError(401, "AUTH_REQUIRED", "Please log in to continue."));
  next();
}

/** Every /api/admin route (except login/forgot/reset) goes through this. */
async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.[sessions.COOKIE.admin];
    const admin = token ? await sessions.findAdminBySession(token) : null;
    if (!admin) throw new AppError(401, "ADMIN_AUTH_REQUIRED", "Please log in as admin.");
    req.admin = admin;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { loadCustomer, requireCustomer, requireAdmin };

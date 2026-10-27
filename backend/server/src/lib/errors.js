// AppError = an expected error with a message that is safe to show the user.
// Anything else is treated as an unexpected error (generic message in production).
class AppError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

const notFound = (what = "Not found") => new AppError(404, "NOT_FOUND", what);
const badRequest = (message, extra) => new AppError(400, "BAD_REQUEST", message, extra);

// Wraps async route handlers so thrown errors reach the error handler (Express 4).
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { AppError, notFound, badRequest, ah };

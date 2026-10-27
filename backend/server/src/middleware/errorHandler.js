const env = require("../config/env");
const { AppError } = require("../lib/errors");
const C = require("../config/constants");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Upload errors (multer)
  if (err && (err.name === "MulterError" || err.code === "INVALID_IMAGE_TYPE")) {
    let status = 400;
    let message = err.message;
    if (err.code === "LIMIT_FILE_SIZE") {
      status = 413;
      message = `Image must be ${C.MAX_UPLOAD_MB} MB or smaller.`;
    } else if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Max ${C.MAX_GALLERY_BATCH} images at a time.`;
    } else if (err.code === "INVALID_IMAGE_TYPE") {
      message = "Only JPG, PNG or WEBP images are allowed.";
    }
    return res.status(status).json({ error: { code: "UPLOAD_ERROR", message } });
  }

  // Bad JSON body / body too large
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: { code: "BAD_JSON", message: "Invalid request." } });
  }
  if (err && err.type === "entity.too.large") {
    return res.status(413).json({ error: { code: "TOO_LARGE", message: "Request is too large." } });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, ...err.extra } });
  }

  // Unexpected: log details on the server, show a simple message to the user.
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({
    error: {
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
      ...(env.isProduction ? {} : { detail: String(err && err.message) }),
    },
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found." } });
}

module.exports = { errorHandler, notFoundHandler };

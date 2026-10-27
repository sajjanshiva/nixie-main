// Receives image uploads in memory (never written to disk).
// The real file type is checked later from the file's bytes (services/images.js).
const multer = require("multer");
const C = require("../config/constants");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: C.MAX_UPLOAD_MB * 1024 * 1024,
    files: C.MAX_GALLERY_BATCH,
    fields: 30,
    fieldSize: 100 * 1024,
  },
  fileFilter: (req, file, cb) => {
    // Quick first check on the declared type. SVG is never allowed.
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    if (!ok) {
      const err = new Error("Only JPG, PNG or WEBP images are allowed.");
      err.code = "INVALID_IMAGE_TYPE";
      return cb(err);
    }
    cb(null, true);
  },
});

module.exports = { upload };

// Checks the REAL file type from the bytes, then re-encodes the image with sharp:
// this removes GPS/EXIF metadata, fixes rotation and resizes large photos.
const sharp = require("sharp");
const { AppError } = require("../lib/errors");

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
let fileTypeFromBuffer = null;

async function detectMime(buffer) {
  if (!fileTypeFromBuffer) {
    ({ fileTypeFromBuffer } = await import("file-type")); // file-type is ESM-only
  }
  const result = await fileTypeFromBuffer(buffer);
  return result ? result.mime : null;
}

/**
 * @returns {Promise<{buffer:Buffer, mime:string, ext:string, width:number, height:number}>}
 */
async function processImage(file, { maxSide = 1600, quality = 85 } = {}) {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new AppError(400, "PHOTO_REQUIRED", "Please choose a photo.");
  }
  const mime = await detectMime(file.buffer);
  if (!mime || !ALLOWED.has(mime)) {
    throw new AppError(400, "INVALID_IMAGE", "Only JPG, PNG or WEBP images are allowed.");
  }
  try {
    const { data, info } = await sharp(file.buffer, { failOn: "error" })
      .rotate() // apply phone rotation before metadata is dropped
      .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
      .webp({ quality }) // output has no EXIF/GPS (sharp drops metadata by default)
      .toBuffer({ resolveWithObject: true });
    return { buffer: data, mime: "image/webp", ext: "webp", width: info.width, height: info.height };
  } catch (_) {
    throw new AppError(400, "INVALID_IMAGE", "This image couldn't be read. Please try another photo.");
  }
}

module.exports = { processImage };

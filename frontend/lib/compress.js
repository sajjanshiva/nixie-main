// Shrinks a photo in the browser before upload: faster on mobile data, cheaper for the AI.
// Never makes a file bigger; falls back to the original if anything goes wrong.

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Returns an error message, or null if the file is OK to upload. */
export function checkImageFile(file) {
  if (!file) return "Please choose a photo.";
  if (!ACCEPTED_TYPES.includes(file.type)) return "Please use a JPG, PNG or WEBP photo.";
  if (file.size > MAX_UPLOAD_BYTES) return "This photo is larger than 10 MB. Please choose a smaller one.";
  return null;
}

export async function compressImage(file, { maxDimension = 2400, quality = 0.92, minBytes = 300 * 1024 } = {}) {
  if (!file || !file.type?.startsWith("image/") || file.size <= minBytes) return file;

  try {
    const bitmap = await loadBitmap(file);
    let { width, height } = bitmap;
    if (width > maxDimension || height > maxDimension) {
      const scale = maxDimension / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    if (bitmap.close) bitmap.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    const base = (file.name || "outfit").replace(/\.[^/.]+$/, "");
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

async function loadBitmap(file) {
  if (typeof createImageBitmap === "function") {
    try {
      // imageOrientation keeps phone photos upright
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall through */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

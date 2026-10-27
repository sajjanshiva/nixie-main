// All images go to ImageKit through the backend only (private key never leaves the server).
// Folders: <root>/analyses, <root>/enquiries, <root>/gallery. Random file names.
const ImageKit = require("imagekit");
const env = require("../config/env");
const { randomToken } = require("../lib/crypto");

const imagekit = new ImageKit({
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
});

const FOLDERS = new Set(["analyses", "enquiries", "gallery"]);

async function uploadImage(buffer, folder, ext = "webp") {
  if (!FOLDERS.has(folder)) throw new Error(`Unknown ImageKit folder: ${folder}`);
  const root = env.IMAGEKIT_ROOT_FOLDER.replace(/\/+$/, "");
  const result = await imagekit.upload({
    file: buffer,
    fileName: `${randomToken(18)}.${ext}`,
    folder: `${root}/${folder}`,
    useUniqueFileName: false,
  });
  return { url: result.url, fileId: result.fileId };
}

/** Deletes a file; never throws (a missing file shouldn't break anything). */
async function deleteImage(fileId) {
  if (!fileId) return;
  try {
    await imagekit.deleteFile(fileId);
  } catch (err) {
    console.warn(`[imagekit] Could not delete ${fileId}: ${err.message}`);
  }
}

module.exports = { uploadImage, deleteImage };

// Admin gallery: list, AI title/tag suggestions (one image per request),
// publish up to 5 images at once, edit, delete.
const express = require("express");
const { query, withTransaction } = require("../../db/pool");
const { ah, AppError, notFound } = require("../../lib/errors");
const { parse } = require("../../middleware/validate");
const { z, uuid, optionalText } = require("../../lib/validators");
const { getPaging } = require("../../lib/pagination");
const { makeSlug } = require("../../lib/slug");
const { upload } = require("../../middleware/upload");
const { processImage } = require("../../services/images");
const { uploadImage, deleteImage } = require("../../services/imagekit");
const gemini = require("../../services/gemini");
const C = require("../../config/constants");
const ser = require("../serializers");

const router = express.Router();

const tagsSchema = z
  .array(z.string().trim().toLowerCase().max(40))
  .max(20)
  .default([])
  .transform((tags) => [...new Set(tags.map((t) => t.replace(/^#/, "").trim()).filter(Boolean))]);

const itemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: optionalText(1000),
  tags: tagsSchema,
});

function searchText({ title, description, tags }) {
  return [title, description || "", (tags || []).join(" ")].join(" ").toLowerCase().replace(/\s+/g, " ").trim();
}

// GET /api/admin/gallery?q=&page=&limit=  (newest first)
router.get(
  "/",
  ah(async (req, res) => {
    const { limit, offset, page } = getPaging(req.query, { defaultLimit: 30, maxLimit: 100 });
    const q = String(req.query.q || "").trim().toLowerCase().slice(0, 100) || null;
    const like = q ? `%${q.replace(/[\\%_]/g, "\\$&")}%` : null;
    const { rows } = await query(
      `SELECT * FROM gallery_images
        WHERE ($1::text IS NULL OR search_text LIKE $1::text)
        ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`,
      [like, limit + 1, offset]
    );
    res.json({ images: rows.slice(0, limit).map(ser.galleryImage), hasMore: rows.length > limit, page });
  })
);

// POST /api/admin/gallery/suggest (multipart "photo") → { title, tags, description, aiFailed }
// The frontend calls this once per image, one after another, with a progress bar.
// Nothing is uploaded here; if AI fails the fields just come back empty.
router.post(
  "/suggest",
  upload.single("photo"),
  ah(async (req, res) => {
    const image = await processImage(req.file, { maxSide: 1024, quality: 80 });
    const suggestion = await gemini.suggestGalleryInfo(image.buffer, image.mime);
    res.json({
      title: suggestion?.title || "",
      tags: suggestion?.tags || [],
      description: suggestion?.description || "",
      aiFailed: !suggestion,
    });
  })
);

// POST /api/admin/gallery (multipart: "photos" ×1–5 + "items" = JSON array of
// { title, description, tags } in the same order) → publishes all
router.post(
  "/",
  upload.array("photos", C.MAX_GALLERY_BATCH),
  ah(async (req, res) => {
    const files = req.files || [];
    if (!files.length) throw new AppError(400, "PHOTO_REQUIRED", "Please choose at least one image.");

    let itemsRaw;
    try {
      itemsRaw = JSON.parse(req.body.items || "[]");
    } catch (_) {
      throw new AppError(400, "BAD_ITEMS", "Invalid image details.");
    }
    const items = parse(z.array(itemSchema).length(files.length, "Each image needs its details."), itemsRaw);

    // Process + upload every image first; if anything fails, remove what was uploaded.
    const uploaded = [];
    try {
      for (const file of files) {
        const image = await processImage(file, { maxSide: 2800, quality: 92 });
        const stored = await uploadImage(image.buffer, "gallery", image.ext);
        uploaded.push({ ...stored, width: image.width, height: image.height });
      }
      const created = await withTransaction(async (client) => {
        const out = [];
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const up = uploaded[i];
          const { rows } = await client.query(
            `INSERT INTO gallery_images
               (slug, title, description, tags, search_text, image_url, image_file_id, width, height)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [makeSlug(it.title), it.title, it.description, it.tags, searchText(it), up.url, up.fileId, up.width, up.height]
          );
          out.push(rows[0]);
        }
        return out;
      });
      res.status(201).json({ images: created.map(ser.galleryImage) });
    } catch (err) {
      for (const up of uploaded) await deleteImage(up.fileId);
      throw err;
    }
  })
);

// PATCH /api/admin/gallery/:id { title, description, tags } (the link/slug stays the same)
router.patch(
  "/:id",
  ah(async (req, res) => {
    const { id } = parse(z.object({ id: uuid }), req.params);
    const body = parse(itemSchema, req.body);
    const { rows } = await query(
      `UPDATE gallery_images
          SET title = $2, description = $3, tags = $4, search_text = $5, updated_at = now()
        WHERE id = $1 RETURNING *`,
      [id, body.title, body.description, body.tags, searchText(body)]
    );
    if (!rows[0]) throw notFound("Image not found.");
    res.json({ image: ser.galleryImage(rows[0]) });
  })
);

// DELETE /api/admin/gallery/:id → deletes the row and the ImageKit file
router.delete(
  "/:id",
  ah(async (req, res) => {
    const { id } = parse(z.object({ id: uuid }), req.params);
    const { rows } = await query("DELETE FROM gallery_images WHERE id = $1 RETURNING image_file_id", [id]);
    if (!rows[0]) throw notFound("Image not found.");
    await deleteImage(rows[0].image_file_id);
    res.json({ ok: true });
  })
);

module.exports = router;

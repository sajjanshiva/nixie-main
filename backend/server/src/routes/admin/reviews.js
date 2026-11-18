// Admin reviews management: list, add, edit, toggle visibility, delete, upload photo
const express = require("express");
const { query } = require("../../db/pool");
const { ah, AppError, notFound } = require("../../lib/errors");
const { parse } = require("../../middleware/validate");
const { z, uuid, optionalText } = require("../../lib/validators");
const { upload } = require("../../middleware/upload");
const { processImage } = require("../../services/images");
const { uploadImage } = require("../../services/imagekit");
const ser = require("../serializers");

const router = express.Router();

const reviewSchema = z.object({
  type: z.enum(["text", "image", "video"]).default("text"),
  clientName: z.string().trim().min(1, "Client name is required").max(100),
  clientLocation: optionalText(100),
  outfitName: optionalText(150),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  quote: z.string().trim().min(1, "Review quote / caption is required").max(1500),
  mediaUrl: z.string().url().nullable().optional(),
  mediaFileId: optionalText(100),
  aspectRatio: z.enum(["square", "tall", "wide"]).default("square"),
  isActive: z.boolean().default(true),
});

// GET /api/admin/reviews
router.get(
  "/",
  ah(async (req, res) => {
    try {
      const { rows } = await query(
        `SELECT * FROM reviews ORDER BY created_at DESC`
      );
      res.json({ reviews: rows.map(ser.review) });
    } catch (err) {
      console.warn("[admin/reviews] fallback on query error:", err.message);
      res.json({ reviews: [] });
    }
  })
);

// POST /api/admin/reviews/upload - upload a photo to ImageKit for a review
router.post(
  "/upload",
  upload.single("photo"),
  ah(async (req, res) => {
    if (!req.file) throw new AppError(400, "PHOTO_REQUIRED", "Please choose an image file.");
    const image = await processImage(req.file, { maxSide: 2048, quality: 90 });
    const stored = await uploadImage(image.buffer, "reviews", image.ext);
    res.json({
      url: stored.url,
      fileId: stored.fileId,
      width: image.width,
      height: image.height,
    });
  })
);

// POST /api/admin/reviews
router.post(
  "/",
  ah(async (req, res) => {
    const data = parse(reviewSchema, req.body);
    const { rows } = await query(
      `INSERT INTO reviews (
        type, client_name, client_location, outfit_name, rating,
        quote, media_url, media_file_id, aspect_ratio, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.type,
        data.clientName,
        data.clientLocation || null,
        data.outfitName || null,
        data.rating,
        data.quote,
        data.mediaUrl || null,
        data.mediaFileId || null,
        data.aspectRatio,
        data.isActive,
      ]
    );
    res.status(201).json({ review: ser.review(rows[0]) });
  })
);

// PATCH /api/admin/reviews/:id
router.patch(
  "/:id",
  ah(async (req, res) => {
    const id = parse(uuid, req.params.id);
    const schema = reviewSchema.partial();
    const data = parse(schema, req.body);

    const updates = [];
    const values = [id];
    let idx = 2;

    if (data.type !== undefined) { updates.push(`type = $${idx++}`); values.push(data.type); }
    if (data.clientName !== undefined) { updates.push(`client_name = $${idx++}`); values.push(data.clientName); }
    if (data.clientLocation !== undefined) { updates.push(`client_location = $${idx++}`); values.push(data.clientLocation); }
    if (data.outfitName !== undefined) { updates.push(`outfit_name = $${idx++}`); values.push(data.outfitName); }
    if (data.rating !== undefined) { updates.push(`rating = $${idx++}`); values.push(data.rating); }
    if (data.quote !== undefined) { updates.push(`quote = $${idx++}`); values.push(data.quote); }
    if (data.mediaUrl !== undefined) { updates.push(`media_url = $${idx++}`); values.push(data.mediaUrl); }
    if (data.aspectRatio !== undefined) { updates.push(`aspect_ratio = $${idx++}`); values.push(data.aspectRatio); }
    if (data.isActive !== undefined) { updates.push(`is_active = $${idx++}`); values.push(data.isActive); }

    if (updates.length === 0) throw new AppError(400, "NO_CHANGES", "No fields to update.");

    updates.push("updated_at = now()");

    const { rows } = await query(
      `UPDATE reviews SET ${updates.join(", ")} WHERE id = $1 RETURNING *`,
      values
    );
    if (!rows[0]) return notFound("Review not found.");
    res.json({ review: ser.review(rows[0]) });
  })
);

// DELETE /api/admin/reviews/:id
router.delete(
  "/:id",
  ah(async (req, res) => {
    const id = parse(uuid, req.params.id);
    const { rows } = await query(`DELETE FROM reviews WHERE id = $1 RETURNING *`, [id]);
    if (!rows[0]) return notFound("Review not found.");
    res.json({ ok: true });
  })
);

module.exports = router;

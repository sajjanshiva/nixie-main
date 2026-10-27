const express = require("express");
const { query } = require("../../db/pool");
const { ah, notFound } = require("../../lib/errors");
const { parse } = require("../../middleware/validate");
const { z, uuid } = require("../../lib/validators");
const { getPaging } = require("../../lib/pagination");
const { deleteImage } = require("../../services/imagekit");
const ser = require("../serializers");

const router = express.Router();
const escapeLike = (s) => s.replace(/[\\%_]/g, "\\$&");

// GET /api/admin/leads?type=ai_analysis|general&q=&page=&limit=   (always latest first)
router.get(
  "/",
  ah(async (req, res) => {
    const { limit, offset, page } = getPaging(req.query, { defaultLimit: 25, maxLimit: 100 });
    const type = ["ai_analysis", "general"].includes(req.query.type) ? req.query.type : null;
    const q = String(req.query.q || "").trim().slice(0, 100) || null;
    const qDigits = q ? q.replace(/\D/g, "") : "";

    const where = [];
    const params = [];
    if (type) {
      params.push(type);
      where.push(`type = $${params.length}`);
    }
    if (q) {
      params.push(`%${escapeLike(q.toLowerCase())}%`);
      const p = params.length;
      let cond = `(lower(name) LIKE $${p} OR lower(email) LIKE $${p}`;
      if (qDigits.length >= 3) {
        params.push(`%${qDigits}%`);
        cond += ` OR phone LIKE $${params.length}`;
      }
      where.push(cond + ")");
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    params.push(limit + 1, offset);
    const { rows } = await query(
      `SELECT * FROM leads ${whereSql} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ leads: rows.slice(0, limit).map(ser.lead), hasMore: rows.length > limit, page });
  })
);

// GET /api/admin/leads/:id
router.get(
  "/:id",
  ah(async (req, res) => {
    const { id } = parse(z.object({ id: uuid }), req.params);
    const { rows } = await query(
      `SELECT l.*, g.slug AS gallery_slug FROM leads l
         LEFT JOIN gallery_images g ON g.id = l.gallery_image_id
        WHERE l.id = $1`,
      [id]
    );
    if (!rows[0]) throw notFound("Lead not found.");
    res.json({ lead: ser.lead(rows[0]) });
  })
);

// DELETE /api/admin/leads/:id (spam/test entries). Deletes an uploaded enquiry photo too.
router.delete(
  "/:id",
  ah(async (req, res) => {
    const { id } = parse(z.object({ id: uuid }), req.params);
    const { rows } = await query("DELETE FROM leads WHERE id = $1 RETURNING photo_file_id", [id]);
    if (!rows[0]) throw notFound("Lead not found.");
    await deleteImage(rows[0].photo_file_id);
    res.json({ ok: true });
  })
);

module.exports = router;

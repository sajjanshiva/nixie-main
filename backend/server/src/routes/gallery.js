// Public inspiration gallery: browse (newest first), smart search, tag filter,
// image page by slug, "More like this" by shared tags.
const express = require("express");
const { query } = require("../db/pool");
const { ah, notFound } = require("../lib/errors");
const { getPaging } = require("../lib/pagination");
const ser = require("./serializers");

const router = express.Router();
const LIST_COLUMNS = "id, slug, title, description, tags, image_url, width, height, created_at";

function cleanText(v, max = 100) {
  const s = String(v || "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, max);
  return s || null;
}
const escapeLike = (s) => s.replace(/[\\%_]/g, "\\$&");

/**
 * Search matches title + description + tags:
 *  • partial words ("lehen" → Lehenga) via ILIKE
 *  • small typos ("lahenga" → Lehenga) via pg_trgm word_similarity
 * Exact/close matches come first, then newest.
 */
async function searchGallery({ q, tag, limit, offset }) {
  const { rows } = await query(
    `SELECT ${LIST_COLUMNS},
            CASE WHEN $1::text IS NULL THEN 0 ELSE word_similarity($1::text, search_text) END AS score
       FROM gallery_images
      WHERE ($2::text IS NULL OR $2::text = ANY(tags))
        AND ($1::text IS NULL
             OR search_text ILIKE '%' || $3::text || '%'
             OR word_similarity($1::text, search_text) >= 0.35)
      ORDER BY score DESC, created_at DESC, id DESC
      LIMIT $4 OFFSET $5`,
    [q, tag, q ? escapeLike(q) : null, limit + 1, offset]
  );
  return { images: rows.slice(0, limit).map(ser.galleryImage), hasMore: rows.length > limit };
}

// GET /api/gallery?q=&tag=&page=&limit=
router.get(
  "/",
  ah(async (req, res) => {
    const { limit, offset, page } = getPaging(req.query, { defaultLimit: 24, maxLimit: 48 });
    const result = await searchGallery({ q: cleanText(req.query.q), tag: cleanText(req.query.tag, 40), limit, offset });
    res.json({ ...result, page });
  })
);

// GET /api/gallery/tags → popular tags for the chips
router.get(
  "/tags",
  ah(async (req, res) => {
    const { rows } = await query(
      `SELECT tag, count(*)::int AS count
         FROM gallery_images, unnest(tags) AS tag
        GROUP BY tag ORDER BY count DESC, tag ASC LIMIT 12`
    );
    res.json({ tags: rows });
  })
);

// GET /api/gallery/:slug → one image + "More like this"
router.get(
  "/:slug",
  ah(async (req, res) => {
    const slug = String(req.params.slug || "").slice(0, 120);
    const { rows } = await query(`SELECT ${LIST_COLUMNS} FROM gallery_images WHERE slug = $1`, [slug]);
    const image = rows[0];
    if (!image) throw notFound("This image is no longer available.");

    const { rows: similar } = await query(
      `SELECT ${LIST_COLUMNS},
              cardinality(ARRAY(SELECT unnest(tags) INTERSECT SELECT unnest($2::text[]))) AS overlap
         FROM gallery_images
        WHERE id <> $1 AND tags && $2::text[]
        ORDER BY overlap DESC, created_at DESC
        LIMIT 12`,
      [image.id, image.tags || []]
    );
    res.json({ image: ser.galleryImage(image), moreLikeThis: similar.map(ser.galleryImage) });
  })
);

module.exports = router;

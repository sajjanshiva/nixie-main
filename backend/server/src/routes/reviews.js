// Public reviews: get active client reviews for the mosaic grid
const express = require("express");
const { query } = require("../db/pool");
const { ah } = require("../lib/errors");
const ser = require("./serializers");

const router = express.Router();

// GET /api/reviews - returns active client reviews ordered by newest first
router.get(
  "/",
  ah(async (req, res) => {
    try {
      const { rows } = await query(
        `SELECT * FROM reviews 
          WHERE is_active = true 
          ORDER BY created_at DESC 
          LIMIT 20`
      );
      return res.json({ reviews: (rows || []).map(ser.review) });
    } catch (err) {
      // If table has not been created yet
      console.warn("[reviews] Table query notice:", err.message);
      return res.json({ reviews: [] });
    }
  })
);

module.exports = router;

// AI outfit analysis. Guests: 3 per 24h (by hashed IP). Logged in: 15 per hour.
// Only SUCCESSFUL analyses are saved, so "AI busy" / errors never use up a free try.
const express = require("express");
const { query } = require("../db/pool");
const { ah, AppError, notFound } = require("../lib/errors");
const { parse } = require("../middleware/validate");
const { z, uuid } = require("../lib/validators");
const { hashToken } = require("../lib/crypto");
const { requireCustomer } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { analysisBurstLimiter } = require("../middleware/rateLimits");
const { processImage } = require("../services/images");
const { uploadImage } = require("../services/imagekit");
const gemini = require("../services/gemini");
const pricing = require("../services/pricing");
const env = require("../config/env");
const C = require("../config/constants");
const ser = require("./serializers");

const router = express.Router();

async function guestUsage(ipHash) {
  const { rows } = await query(
    `SELECT count(*)::int AS n FROM analyses
      WHERE created_as_guest AND ip_hash = $1 AND created_at > now() - interval '24 hours'`,
    [ipHash]
  );
  return rows[0].n;
}

async function userUsage(customerId) {
  const { rows } = await query(
    `SELECT count(*)::int AS n FROM analyses
      WHERE customer_id = $1 AND created_at > now() - interval '1 hour'`,
    [customerId]
  );
  return rows[0].n;
}

// GET /api/analyses/limit → how many analyses are left (for the UI)
router.get(
  "/limit",
  ah(async (req, res) => {
    if (req.customer) {
      const used = await userUsage(req.customer.id);
      return res.json({ loggedIn: true, limit: C.USER_ANALYSES_PER_HOUR, period: "hour", remaining: Math.max(0, C.USER_ANALYSES_PER_HOUR - used) });
    }
    const used = await guestUsage(hashToken(`ip:${req.ip}`));
    res.json({ loggedIn: false, limit: C.GUEST_ANALYSES_PER_DAY, period: "day", remaining: Math.max(0, C.GUEST_ANALYSES_PER_DAY - used) });
  })
);

// POST /api/analyses  (multipart, field "photo") → analysis result
router.post(
  "/",
  analysisBurstLimiter,
  upload.single("photo"),
  ah(async (req, res) => {
    const customer = req.customer || null;
    const ipHash = hashToken(`ip:${req.ip}`);

    // 1) Limits (checked on the server; the browser count is only a soft limit)
    if (customer) {
      if ((await userUsage(customer.id)) >= C.USER_ANALYSES_PER_HOUR) {
        throw new AppError(429, "USER_LIMIT", `You've reached ${C.USER_ANALYSES_PER_HOUR} analyses this hour. Please try again a little later.`);
      }
    } else {
      if ((await guestUsage(ipHash)) >= C.GUEST_ANALYSES_PER_DAY) {
        throw new AppError(429, "GUEST_LIMIT", `You've used your ${C.GUEST_ANALYSES_PER_DAY} free analyses. Log in to continue.`);
      }
      const { rows } = await query(
        "SELECT count(*)::int AS n FROM analyses WHERE created_as_guest AND created_at > now() - interval '24 hours'"
      );
      if (rows[0].n >= env.GUEST_ANALYSIS_DAILY_CAP) {
        // Safety cap for the whole site (protects the Gemini key). Shown as "busy".
        throw new AppError(503, "AI_BUSY", "Our AI is busy, please try again in a minute.");
      }
    }

    // 2) Check + clean the image (real file type, strip GPS, resize)
    const image = await processImage(req.file, { maxSide: 2400, quality: 90 });

    // 3) Gemini detects outfit + fabrics (names forced from the sheet lists)
    const lists = await pricing.getLists();
    const detected = await gemini.detectOutfit(image.buffer, image.mime, lists);

    // 4) Our code calculates the price (never the AI)
    const price = await pricing.calculatePrice(detected.outfitType, detected.primaryFabric, detected.secondaryFabrics);

    // 5) Save photo + result
    const stored = await uploadImage(image.buffer, "analyses", image.ext);
    const { rows } = await query(
      `INSERT INTO analyses
         (customer_id, created_as_guest, ip_hash, image_url, image_file_id, outfit_type,
          primary_fabric, secondary_fabrics, ai_comment, score, estimated_price_rupees)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        customer ? customer.id : null,
        !customer,
        ipHash,
        stored.url,
        stored.fileId,
        detected.outfitType,
        detected.primaryFabric,
        detected.secondaryFabrics,
        detected.aiComment,
        price.score,
        price.priceRupees,
      ]
    );
    res.status(201).json({ analysis: ser.analysis(rows[0]) });
  })
);

// GET /api/analyses/:id → one result.
// Linked analyses: only their owner. Guest analyses: anyone with the (unguessable) id,
// so the result page and the after-login summary card work.
router.get(
  "/:id",
  ah(async (req, res) => {
    const { id } = parse(z.object({ id: uuid }), req.params);
    const { rows } = await query("SELECT * FROM analyses WHERE id = $1", [id]);
    const a = rows[0];
    if (!a) throw notFound("This analysis is no longer available.");
    if (a.customer_id && (!req.customer || req.customer.id !== a.customer_id)) {
      throw notFound("This analysis is no longer available.");
    }
    res.json({ analysis: ser.analysis(a) });
  })
);

// POST /api/analyses/:id/claim → after login, link a guest analysis to this account
router.post(
  "/:id/claim",
  requireCustomer,
  ah(async (req, res) => {
    const { id } = parse(z.object({ id: uuid }), req.params);
    const { rows } = await query(
      `UPDATE analyses SET customer_id = $2
        WHERE id = $1 AND (customer_id IS NULL OR customer_id = $2)
      RETURNING *`,
      [id, req.customer.id]
    );
    if (!rows[0]) throw notFound("This analysis is no longer available.");
    res.json({ analysis: ser.analysis(rows[0]) });
  })
);

module.exports = router;

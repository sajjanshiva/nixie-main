// Contact form (login required). Three versions:
//  • with analysisId      → "AI Analysis" lead (analysis photo attached, no upload)
//  • with galleryImageId  → "General Enquiry" with the gallery image (no upload)
//  • neither              → "General Enquiry", optional photo upload
// The server reads outfit/fabrics/price from the DATABASE — never from the browser.
const express = require("express");
const { query, withTransaction } = require("../db/pool");
const { ah, AppError, notFound } = require("../lib/errors");
const { parse } = require("../middleware/validate");
const { z, phone, name, email, address, uuid, optionalText } = require("../lib/validators");
const { requireCustomer } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { processImage } = require("../services/images");
const { uploadImage, deleteImage } = require("../services/imagekit");
const C = require("../config/constants");
const ser = require("./serializers");

const router = express.Router();

const leadSchema = z
  .object({
    analysisId: uuid.optional().or(z.literal("").transform(() => undefined)),
    galleryImageId: uuid.optional().or(z.literal("").transform(() => undefined)),
    name,
    phone,
    email,
    ...address,
    message: optionalText(2000),
  })
  .refine((d) => !(d.analysisId && d.galleryImageId), { message: "Invalid enquiry.", path: ["_"] });

// POST /api/leads (multipart: fields above + optional "photo" for general enquiries)
router.post(
  "/",
  requireCustomer,
  upload.single("photo"),
  ah(async (req, res) => {
    const me = req.customer;
    const body = parse(leadSchema, req.body);

    const { rows: cnt } = await query(
      "SELECT count(*)::int AS n FROM leads WHERE customer_id = $1 AND created_at > now() - interval '1 hour'",
      [me.id]
    );
    if (cnt[0].n >= C.LEADS_PER_HOUR) {
      throw new AppError(429, "LEAD_LIMIT", "You've sent several enquiries recently. Please try again in a little while.");
    }

    let type = "general";
    let analysis = null;
    let gallery = null;

    if (body.analysisId) {
      type = "ai_analysis";
      // Link the analysis to this customer if it was a guest analysis.
      const { rows } = await query(
        `UPDATE analyses SET customer_id = $2
          WHERE id = $1 AND (customer_id IS NULL OR customer_id = $2)
        RETURNING *`,
        [body.analysisId, me.id]
      );
      analysis = rows[0];
      if (!analysis) throw notFound("This analysis is no longer available. Please analyse your outfit again.");
    } else if (body.galleryImageId) {
      const { rows } = await query("SELECT id, title, image_url FROM gallery_images WHERE id = $1", [
        body.galleryImageId,
      ]);
      gallery = rows[0];
      if (!gallery) throw notFound("This gallery image is no longer available.");
    }

    // Photo upload only for a plain general enquiry (hidden in the other two forms).
    let photo = null;
    if (type === "general" && !gallery && req.file) {
      const image = await processImage(req.file, { maxSide: 1600 });
      photo = await uploadImage(image.buffer, "enquiries", image.ext);
    }

    try {
      const lead = await withTransaction(async (client) => {
        const { rows } = await client.query(
          `INSERT INTO leads
             (customer_id, type, analysis_id, gallery_image_id, name, phone, email, address_line, city, state,
              pincode, message, photo_url, photo_file_id, outfit_type, primary_fabric, secondary_fabrics,
              estimated_price_rupees, analysis_image_url, gallery_title, gallery_image_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
           RETURNING *`,
          [
            me.id,
            type,
            analysis?.id || null,
            gallery?.id || null,
            body.name,
            body.phone,
            body.email,
            body.addressLine,
            body.city,
            body.state,
            body.pincode,
            body.message,
            photo?.url || null,
            photo?.fileId || null,
            analysis?.outfit_type || null,
            analysis?.primary_fabric || null,
            analysis ? analysis.secondary_fabrics : null,
            analysis?.estimated_price_rupees ?? null,
            analysis?.image_url || null,
            gallery?.title || null,
            gallery?.image_url || null,
          ]
        );
        // Save contact details to the profile so they're prefilled next time.
        await client.query(
          `UPDATE customers
              SET name = $2, phone = $3, address_line = $4, city = $5, state = $6, pincode = $7, updated_at = now()
            WHERE id = $1`,
          [me.id, body.name, body.phone, body.addressLine, body.city, body.state, body.pincode]
        );
        return rows[0];
      });
      res.status(201).json({ lead: ser.lead(lead) });
    } catch (err) {
      if (photo) await deleteImage(photo.fileId); // don't leave an orphan photo
      throw err;
    }
  })
);

module.exports = router;

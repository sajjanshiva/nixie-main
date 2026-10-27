// Logged-in customer: profile + "My analyses", "My invoices", "My enquiries".
// Every query is scoped to req.customer.id (customers only see their own data).
const express = require("express");
const { query } = require("../db/pool");
const { ah } = require("../lib/errors");
const { parse } = require("../middleware/validate");
const { z, name, phone, address } = require("../lib/validators");
const { requireCustomer } = require("../middleware/auth");
const { getPaging } = require("../lib/pagination");
const ser = require("./serializers");

const router = express.Router();
router.use(requireCustomer);

// GET /api/me
router.get(
  "/",
  ah(async (req, res) => {
    res.json({ customer: ser.publicCustomer(req.customer) });
  })
);

// PATCH /api/me { name, phone, addressLine, city, state, pincode } (email is not editable)
router.patch(
  "/",
  ah(async (req, res) => {
    const body = parse(
      z.object({
        name,
        phone,
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      }),
      req.body
    );
    const { rows } = await query(
      `UPDATE customers
          SET name = $2, phone = $3, address_line = $4, city = $5, state = $6, pincode = $7, updated_at = now()
        WHERE id = $1 RETURNING *`,
      [req.customer.id, body.name, body.phone, body.addressLine, body.city, body.state, body.pincode]
    );
    res.json({ customer: ser.publicCustomer(rows[0]) });
  })
);

// GET /api/me/analyses?page=
router.get(
  "/analyses",
  ah(async (req, res) => {
    const { limit, offset } = getPaging(req.query, { defaultLimit: 20, maxLimit: 50 });
    const { rows } = await query(
      `SELECT * FROM analyses WHERE customer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.customer.id, limit + 1, offset]
    );
    res.json({ analyses: rows.slice(0, limit).map(ser.analysis), hasMore: rows.length > limit });
  })
);

// GET /api/me/leads?page=   ("My enquiries")
router.get(
  "/leads",
  ah(async (req, res) => {
    const { limit, offset } = getPaging(req.query, { defaultLimit: 20, maxLimit: 50 });
    const { rows } = await query(
      `SELECT l.*, g.slug AS gallery_slug FROM leads l
         LEFT JOIN gallery_images g ON g.id = l.gallery_image_id
        WHERE l.customer_id = $1 ORDER BY l.created_at DESC LIMIT $2 OFFSET $3`,
      [req.customer.id, limit + 1, offset]
    );
    res.json({ leads: rows.slice(0, limit).map(ser.lead), hasMore: rows.length > limit });
  })
);

// GET /api/me/invoices → invoices sent to this account's email (paid, partially paid, unpaid)
router.get(
  "/invoices",
  ah(async (req, res) => {
    const { rows } = await query(
      `SELECT * FROM invoices
        WHERE customer_email = $1 AND status IN ('sent', 'partially_paid', 'paid')
        ORDER BY sent_at DESC NULLS LAST, created_at DESC`,
      [req.customer.email]
    );
    res.json({
      invoices: rows.map((inv) => {
        const p = ser.publicInvoice(inv);
        return {
          label: p.label,
          status: p.status,
          token: p.token, // open /pay/<token> to view or pay
          totals: p.totals,
          sentAt: p.sentAt,
          paidAt: p.paidAt,
        };
      }),
    });
  })
);

module.exports = router;

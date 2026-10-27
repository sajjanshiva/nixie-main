const express = require("express");
const { query } = require("../../db/pool");
const { ah } = require("../../lib/errors");
const { invoiceLabel } = require("../../lib/format");

const router = express.Router();

// GET /api/admin/dashboard
router.get(
  "/",
  ah(async (req, res) => {
    const [stats, recentLeads, recentPayments] = await Promise.all([
      query(`
        SELECT
          (SELECT count(*)::int FROM leads WHERE created_at > now() - interval '7 days') AS new_leads_week,
          (SELECT count(*)::int FROM invoices WHERE status = 'sent') AS unpaid_count,
          (SELECT COALESCE(sum(total_paise - paid_paise), 0)::bigint FROM invoices WHERE status = 'sent') AS unpaid_paise,
          (SELECT count(*)::int FROM invoices WHERE status = 'partially_paid') AS partial_count,
          (SELECT COALESCE(sum(total_paise - paid_paise), 0)::bigint FROM invoices WHERE status = 'partially_paid') AS balance_due_paise,
          (SELECT COALESCE(sum(amount_paise), 0)::bigint FROM payments
             WHERE status = 'paid'
               AND paid_at >= date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata'
          ) AS received_month_paise
      `),
      query(`SELECT id, type, name, created_at FROM leads ORDER BY created_at DESC LIMIT 5`),
      query(`
        SELECT p.id, p.amount_paise, p.kind, p.method, p.paid_at, i.id AS invoice_id, i.number, i.status, i.customer_name
          FROM payments p JOIN invoices i ON i.id = p.invoice_id
         WHERE p.status = 'paid'
         ORDER BY p.paid_at DESC LIMIT 5`),
    ]);
    const s = stats.rows[0];
    res.json({
      stats: {
        newLeadsThisWeek: s.new_leads_week,
        unpaidInvoices: { count: s.unpaid_count, amountPaise: Number(s.unpaid_paise) },
        balanceDue: { count: s.partial_count, amountPaise: Number(s.balance_due_paise) },
        receivedThisMonthPaise: Number(s.received_month_paise),
      },
      recentLeads: recentLeads.rows.map((l) => ({ id: l.id, type: l.type, name: l.name, createdAt: l.created_at })),
      recentPayments: recentPayments.rows.map((p) => ({
        id: p.id,
        invoiceId: p.invoice_id,
        invoiceLabel: invoiceLabel(p.number),
        customerName: p.customer_name,
        amountPaise: p.amount_paise,
        kind: p.kind,
        method: p.method,
        invoiceStatus: p.status,
        paidAt: p.paid_at,
      })),
    });
  })
);

module.exports = router;

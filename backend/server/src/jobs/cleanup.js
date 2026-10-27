// Daily housekeeping (also runs shortly after every server start, because the
// Render free tier sleeps and the daily time may be missed):
//  • deletes guest analyses (+ photos) older than 7 days that were never linked to an account
//  • deletes expired sessions, OTPs and reset links
//  • re-checks old "pending" Cashfree payments (in case a webhook was missed)
const cron = require("node-cron");
const { query } = require("../db/pool");
const { deleteImage } = require("../services/imagekit");
const { syncPayment } = require("../services/payments");
const C = require("../config/constants");

let running = false;

async function runCleanup() {
  if (running) return;
  running = true;
  try {
    // 1) Old guest analyses (batch of 200 per run keeps it light)
    const { rows } = await query(
      `SELECT id, image_file_id FROM analyses
        WHERE customer_id IS NULL AND created_at < now() - ($1 || ' days')::interval
        ORDER BY created_at LIMIT 200`,
      [String(C.GUEST_ANALYSIS_RETENTION_DAYS)]
    );
    for (const row of rows) {
      await deleteImage(row.image_file_id);
      await query("DELETE FROM analyses WHERE id = $1 AND customer_id IS NULL", [row.id]);
    }

    // 2) Expired auth records
    const s = await query("DELETE FROM sessions WHERE expires_at < now()");
    const o = await query("DELETE FROM signup_otps WHERE expires_at < now() - interval '1 day'");
    const r = await query(
      "DELETE FROM password_resets WHERE expires_at < now() - interval '1 day' OR used_at < now() - interval '1 day'"
    );

    // 3) Old pending payments (older than 2 hours, younger than 7 days)
    const { rows: pending } = await query(
      `SELECT cf_order_id FROM payments
        WHERE status = 'pending' AND method = 'cashfree'
          AND created_at < now() - interval '2 hours' AND created_at > now() - interval '7 days'
        LIMIT 50`
    );
    for (const p of pending) await syncPayment(p.cf_order_id);

    console.log(
      `[cleanup] guest analyses: ${rows.length}, sessions: ${s.rowCount}, otps: ${o.rowCount}, resets: ${r.rowCount}, pending checked: ${pending.length}`
    );
  } catch (err) {
    console.error("[cleanup] Failed:", err.message);
  } finally {
    running = false;
  }
}

function startCleanupJob() {
  cron.schedule("30 3 * * *", runCleanup, { timezone: "Asia/Kolkata" }); // 3:30 AM IST daily
  setTimeout(runCleanup, 60_000).unref(); // and 1 minute after each start
}

module.exports = { startCleanupJob, runCleanup };

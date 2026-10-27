// Admin login: email + password, 5 wrong tries → locked 15 minutes, 24-hour session.
const express = require("express");
const bcrypt = require("bcryptjs");
const { query, withTransaction } = require("../../db/pool");
const { ah, AppError } = require("../../lib/errors");
const { parse } = require("../../middleware/validate");
const { z, email, adminPassword, token } = require("../../lib/validators");
const { hashToken, randomToken } = require("../../lib/crypto");
const { authBurstLimiter } = require("../../middleware/rateLimits");
const { requireAdmin } = require("../../middleware/auth");
const sessions = require("../../services/sessions");
const { sendEmail } = require("../../services/email");
const templates = require("../../services/emailTemplates");
const env = require("../../config/env");
const C = require("../../config/constants");

const router = express.Router();
const DUMMY_HASH = bcrypt.hashSync("nixie-admin-dummy", 10);

// POST /api/admin/auth/login { email, password }
router.post(
  "/login",
  authBurstLimiter,
  ah(async (req, res) => {
    const body = parse(z.object({ email, password: z.string().min(1).max(C.PASSWORD_MAX) }), req.body);
    const { rows } = await query("SELECT * FROM admins WHERE email = $1", [body.email]);
    const admin = rows[0];

    if (!admin) {
      await bcrypt.compare(body.password, DUMMY_HASH); // same timing as a real check
      throw new AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
    }
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      const minutes = Math.ceil((new Date(admin.locked_until) - Date.now()) / 60000);
      throw new AppError(423, "LOCKED", `Too many wrong tries. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
    }

    const ok = await bcrypt.compare(body.password, admin.password_hash);
    if (!ok) {
      const attempts = admin.failed_attempts + 1;
      if (attempts >= C.ADMIN_MAX_FAILED) {
        await query(
          `UPDATE admins SET failed_attempts = 0, locked_until = now() + ($2 || ' minutes')::interval WHERE id = $1`,
          [admin.id, String(C.ADMIN_LOCK_MINUTES)]
        );
        throw new AppError(423, "LOCKED", `Too many wrong tries. Try again in ${C.ADMIN_LOCK_MINUTES} minutes.`);
      }
      await query("UPDATE admins SET failed_attempts = $2 WHERE id = $1", [admin.id, attempts]);
      throw new AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
    }

    await query("UPDATE admins SET failed_attempts = 0, locked_until = NULL WHERE id = $1", [admin.id]);
    await sessions.startSession(res, req, "admin", admin.id);
    res.json({ admin: { id: admin.id, email: admin.email } });
  })
);

// POST /api/admin/auth/logout
router.post(
  "/logout",
  ah(async (req, res) => {
    await sessions.endSession(res, req, "admin");
    res.json({ ok: true });
  })
);

// GET /api/admin/auth/me → the logged-in admin (401 if not logged in)
router.get(
  "/me",
  requireAdmin,
  ah(async (req, res) => {
    res.json({ admin: { id: req.admin.id, email: req.admin.email } });
  })
);

// POST /api/admin/auth/forgot { email }
router.post(
  "/forgot",
  authBurstLimiter,
  ah(async (req, res) => {
    const body = parse(z.object({ email }), req.body);
    const { rows } = await query("SELECT id FROM admins WHERE email = $1", [body.email]);
    const admin = rows[0];
    if (admin) {
      const { rows: cnt } = await query(
        "SELECT count(*)::int AS n FROM password_resets WHERE admin_id = $1 AND created_at > now() - interval '1 hour'",
        [admin.id]
      );
      if (cnt[0].n < C.RESET_MAX_PER_HOUR) {
        const raw = randomToken(32);
        await query(
          `INSERT INTO password_resets (token_hash, user_type, admin_id, expires_at)
           VALUES ($1, 'admin', $2, now() + ($3 || ' minutes')::interval)`,
          [hashToken(raw), admin.id, String(C.RESET_TTL_MINUTES)]
        );
        const mail = templates.passwordReset({
          link: `${env.FRONTEND_URL}/admin/reset-password?token=${raw}`,
          minutes: C.RESET_TTL_MINUTES,
          isAdmin: true,
        });
        await sendEmail({ to: body.email, ...mail });
      }
    }
    res.json({ ok: true, message: "If this email belongs to the admin, we've sent a reset link." });
  })
);

// POST /api/admin/auth/reset { token, password } (min 12 characters)
router.post(
  "/reset",
  authBurstLimiter,
  ah(async (req, res) => {
    const body = parse(z.object({ token, password: adminPassword }), req.body);
    const passwordHash = await bcrypt.hash(body.password, C.BCRYPT_ROUNDS);
    await withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT * FROM password_resets
          WHERE token_hash = $1 AND user_type = 'admin' AND used_at IS NULL AND expires_at > now()
          FOR UPDATE`,
        [hashToken(body.token)]
      );
      const reset = rows[0];
      if (!reset) throw new AppError(400, "RESET_INVALID", "This reset link is invalid or has expired.");
      await client.query("UPDATE password_resets SET used_at = now() WHERE id = $1", [reset.id]);
      await client.query(
        "UPDATE admins SET password_hash = $2, failed_attempts = 0, locked_until = NULL WHERE id = $1",
        [reset.admin_id, passwordHash]
      );
      await client.query("DELETE FROM sessions WHERE admin_id = $1", [reset.admin_id]);
    });
    res.json({ ok: true, message: "Password updated. Please log in." });
  })
);

module.exports = router;

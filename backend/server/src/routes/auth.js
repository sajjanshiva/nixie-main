// Customer login: Google, or email + password (email verified once with a 6-digit OTP).
const express = require("express");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const { query, withTransaction } = require("../db/pool");
const { ah, AppError } = require("../lib/errors");
const { parse } = require("../middleware/validate");
const { z, email, customerPassword, token } = require("../lib/validators");
const { hashToken, randomOtp, randomToken, safeEqual } = require("../lib/crypto");
const { customerLoginLimiter, authBurstLimiter } = require("../middleware/rateLimits");
const sessions = require("../services/sessions");
const { sendEmail } = require("../services/email");
const templates = require("../services/emailTemplates");
const env = require("../config/env");
const C = require("../config/constants");
const { publicCustomer } = require("./serializers");

const router = express.Router();
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// Used to keep "wrong email" and "wrong password" equally slow (no account enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync("nixie-dummy-password", 10);
// Marks an OTP row that was only stored for rate-limit counting ("account already exists" email).
const EXISTS_MARKER = "!account-exists";

const SENT_MESSAGE = "We've sent a 6-digit code to your email.";
const RESET_MESSAGE = "If an account exists for this email, we've sent a reset link.";

// ---------------------------------------------------------------- session
// GET /api/auth/session → current customer or null (never 401)
router.get(
  "/session",
  ah(async (req, res) => {
    res.json({ customer: req.customer ? publicCustomer(req.customer) : null });
  })
);

// ---------------------------------------------------------------- signup
async function checkOtpSendLimits(emailAddr) {
  const { rows } = await query(
    `SELECT
        count(*) FILTER (WHERE created_at > now() - interval '1 hour')::int AS last_hour,
        max(created_at) AS last_sent
       FROM signup_otps WHERE email = $1`,
    [emailAddr]
  );
  const { last_hour: lastHour, last_sent: lastSent } = rows[0];
  if (lastSent) {
    const secondsSince = (Date.now() - new Date(lastSent).getTime()) / 1000;
    if (secondsSince < C.OTP_RESEND_SECONDS) {
      const wait = Math.ceil(C.OTP_RESEND_SECONDS - secondsSince);
      throw new AppError(429, "OTP_TOO_SOON", `Please wait ${wait} seconds before requesting a new code.`, {
        retryAfterSeconds: wait,
      });
    }
  }
  if (lastHour >= C.OTP_MAX_PER_HOUR) {
    throw new AppError(429, "OTP_LIMIT", "Too many codes requested. Please try again in an hour.");
  }
}

async function createAndSendOtp(emailAddr, passwordHash, name) {
  const code = randomOtp();
  // Expire older codes for this email so only one active OTP exists at a time.
  await query("UPDATE signup_otps SET expires_at = now() WHERE email = $1 AND expires_at > now()", [emailAddr]);
  const { rows } = await query(
    `INSERT INTO signup_otps (email, code_hash, password_hash, name, expires_at)
     VALUES ($1, $2, $3, $4, now() + ($5 || ' minutes')::interval)
     RETURNING id`,
    [emailAddr, hashToken(`${emailAddr}:${code}`), passwordHash, name, String(C.OTP_TTL_MINUTES)]
  );
  const otpId = rows[0].id;
  try {
    const mail = templates.signupOtp({ code, minutes: C.OTP_TTL_MINUTES });
    await sendEmail({ to: emailAddr, ...mail });
  } catch (err) {
    // Email delivery failed: remove the OTP row so the rate limiter does not
    // block a retry and the frontend stays on the signup form.
    await query("DELETE FROM signup_otps WHERE id = $1", [otpId]);
    throw err;
  }
}

// POST /api/auth/signup { email, password, name? }
router.post(
  "/signup",
  authBurstLimiter,
  ah(async (req, res) => {
    const body = parse(
      z.object({
        email,
        password: customerPassword,
        name: z.string().trim().max(100).optional(),
      }),
      req.body
    );

    await checkOtpSendLimits(body.email);

    const { rows } = await query("SELECT id, password_hash FROM customers WHERE email = $1", [body.email]);
    const existing = rows[0];

    if (existing && existing.password_hash) {
      // Same response as a new signup (no account enumeration), but the email says "you already have an account".
      // A row is still stored so the resend/hour limits apply to this email too.
      await query(
        `INSERT INTO signup_otps (email, code_hash, password_hash, name, expires_at)
         VALUES ($1, $2, $3, NULL, now())`,
        [body.email, hashToken(randomToken(16)), EXISTS_MARKER]
      );
      const mail = templates.signupAccountExists({
        loginUrl: `${env.FRONTEND_URL}/login`,
        resetUrl: `${env.FRONTEND_URL}/forgot-password`,
      });
      await sendEmail({ to: body.email, ...mail });
      return res.json({ ok: true, message: SENT_MESSAGE });
    }

    const passwordHash = await bcrypt.hash(body.password, C.BCRYPT_ROUNDS);
    await createAndSendOtp(body.email, passwordHash, body.name || null);
    res.json({ ok: true, message: SENT_MESSAGE });
  })
);

// POST /api/auth/signup/resend { email }
router.post(
  "/signup/resend",
  authBurstLimiter,
  ah(async (req, res) => {
    const body = parse(z.object({ email }), req.body);
    const { rows } = await query(
      `SELECT password_hash, name FROM signup_otps
        WHERE email = $1 AND created_at > now() - interval '1 day'
        ORDER BY created_at DESC LIMIT 1`,
      [body.email]
    );
    const last = rows[0];
    if (!last || last.password_hash === EXISTS_MARKER) {
      // Nothing pending (or account already exists): same generic answer.
      return res.json({ ok: true, message: SENT_MESSAGE });
    }
    await checkOtpSendLimits(body.email);
    await createAndSendOtp(body.email, last.password_hash, last.name);
    res.json({ ok: true, message: SENT_MESSAGE });
  })
);

// POST /api/auth/signup/verify { email, code } → creates the account and logs in
router.post(
  "/signup/verify",
  authBurstLimiter,
  ah(async (req, res) => {
    const body = parse(
      z.object({ email, code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") }),
      req.body
    );

    const { rows } = await query(
      `SELECT * FROM signup_otps WHERE email = $1 AND expires_at > now()
        ORDER BY created_at DESC LIMIT 1`,
      [body.email]
    );
    const otp = rows[0];
    if (!otp || otp.password_hash === EXISTS_MARKER) {
      throw new AppError(400, "CODE_EXPIRED", "This code has expired. Please request a new one.");
    }
    if (otp.attempts >= C.OTP_MAX_ATTEMPTS) {
      throw new AppError(400, "CODE_LOCKED", "Too many wrong tries. Please request a new code.");
    }
    if (!safeEqual(otp.code_hash, hashToken(`${body.email}:${body.code}`))) {
      const { rows: upd } = await query(
        "UPDATE signup_otps SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts",
        [otp.id]
      );
      const left = Math.max(0, C.OTP_MAX_ATTEMPTS - upd[0].attempts);
      throw new AppError(400, "INVALID_CODE", left ? `Wrong code. ${left} tries left.` : "Too many wrong tries. Please request a new code.", {
        attemptsLeft: left,
      });
    }

    const customer = await withTransaction(async (client) => {
      await client.query("DELETE FROM signup_otps WHERE email = $1", [body.email]);
      const { rows: found } = await client.query("SELECT * FROM customers WHERE email = $1 FOR UPDATE", [
        body.email,
      ]);
      if (found[0]) {
        if (found[0].password_hash) {
          throw new AppError(409, "ACCOUNT_EXISTS", "You already have an account. Please log in.");
        }
        // Google-only account: verified email + chosen password are added to it.
        const { rows: upd } = await client.query(
          `UPDATE customers SET password_hash = $2, name = COALESCE(name, $3), updated_at = now()
            WHERE id = $1 RETURNING *`,
          [found[0].id, otp.password_hash, otp.name]
        );
        return upd[0];
      }
      const { rows: created } = await client.query(
        "INSERT INTO customers (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *",
        [body.email, otp.password_hash, otp.name]
      );
      return created[0];
    });

    await sessions.startSession(res, req, "customer", customer.id);
    res.json({ customer: publicCustomer(customer) });
  })
);

// ---------------------------------------------------------------- login
// POST /api/auth/login { email, password }
router.post(
  "/login",
  customerLoginLimiter,
  ah(async (req, res) => {
    const body = parse(z.object({ email, password: z.string().min(1).max(C.PASSWORD_MAX) }), req.body);
    const { rows } = await query("SELECT * FROM customers WHERE email = $1", [body.email]);
    const customer = rows[0];
    const ok = await bcrypt.compare(body.password, customer?.password_hash || DUMMY_HASH);
    if (!customer || !customer.password_hash || !ok) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
    }
    await sessions.startSession(res, req, "customer", customer.id);
    res.json({ customer: publicCustomer(customer) });
  })
);

// POST /api/auth/google { credential }  (the ID token from Google Identity Services)
router.post(
  "/google",
  authBurstLimiter,
  ah(async (req, res) => {
    const body = parse(z.object({ credential: z.string().min(20).max(5000) }), req.body);
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: body.credential, audience: env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch (_) {
      throw new AppError(401, "GOOGLE_INVALID", "Google sign-in failed. Please try again.");
    }
    if (!payload?.email || !payload.email_verified) {
      throw new AppError(401, "GOOGLE_UNVERIFIED", "Your Google email isn't verified.");
    }
    const emailAddr = payload.email.toLowerCase();
    const googleName = payload.name ? String(payload.name).slice(0, 100) : null;

    const customer = await withTransaction(async (client) => {
      const { rows: bySub } = await client.query("SELECT * FROM customers WHERE google_sub = $1", [payload.sub]);
      if (bySub[0]) return bySub[0];

      // Same email = same account: link Google to the existing email account.
      const { rows: byEmail } = await client.query("SELECT * FROM customers WHERE email = $1 FOR UPDATE", [
        emailAddr,
      ]);
      if (byEmail[0]) {
        const { rows: upd } = await client.query(
          `UPDATE customers SET google_sub = $2, name = COALESCE(name, $3), updated_at = now()
            WHERE id = $1 RETURNING *`,
          [byEmail[0].id, payload.sub, googleName]
        );
        return upd[0];
      }
      const { rows: created } = await client.query(
        "INSERT INTO customers (email, google_sub, name) VALUES ($1, $2, $3) RETURNING *",
        [emailAddr, payload.sub, googleName]
      );
      return created[0];
    });

    await sessions.startSession(res, req, "customer", customer.id);
    res.json({ customer: publicCustomer(customer) });
  })
);

// POST /api/auth/logout
router.post(
  "/logout",
  ah(async (req, res) => {
    await sessions.endSession(res, req, "customer");
    res.json({ ok: true });
  })
);

// ---------------------------------------------------------------- password reset
// POST /api/auth/forgot { email }
router.post(
  "/forgot",
  authBurstLimiter,
  ah(async (req, res) => {
    const body = parse(z.object({ email }), req.body);
    const { rows } = await query("SELECT id FROM customers WHERE email = $1", [body.email]);
    const customer = rows[0];
    if (customer) {
      const { rows: cnt } = await query(
        `SELECT count(*)::int AS n FROM password_resets
          WHERE customer_id = $1 AND created_at > now() - interval '1 hour'`,
        [customer.id]
      );
      if (cnt[0].n < C.RESET_MAX_PER_HOUR) {
        const raw = randomToken(32);
        await query(
          `INSERT INTO password_resets (token_hash, user_type, customer_id, expires_at)
           VALUES ($1, 'customer', $2, now() + ($3 || ' minutes')::interval)`,
          [hashToken(raw), customer.id, String(C.RESET_TTL_MINUTES)]
        );
        const mail = templates.passwordReset({
          link: `${env.FRONTEND_URL}/reset-password?token=${raw}`,
          minutes: C.RESET_TTL_MINUTES,
          isAdmin: false,
        });
        await sendEmail({ to: body.email, ...mail });
      }
    }
    res.json({ ok: true, message: RESET_MESSAGE });
  })
);

// POST /api/auth/reset { token, password } → sets the new password and logs out everywhere
router.post(
  "/reset",
  authBurstLimiter,
  ah(async (req, res) => {
    const body = parse(z.object({ token, password: customerPassword }), req.body);
    const passwordHash = await bcrypt.hash(body.password, C.BCRYPT_ROUNDS);
    await withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT * FROM password_resets
          WHERE token_hash = $1 AND user_type = 'customer' AND used_at IS NULL AND expires_at > now()
          FOR UPDATE`,
        [hashToken(body.token)]
      );
      const reset = rows[0];
      if (!reset) throw new AppError(400, "RESET_INVALID", "This reset link is invalid or has expired.");
      await client.query("UPDATE password_resets SET used_at = now() WHERE id = $1", [reset.id]);
      await client.query("UPDATE customers SET password_hash = $2, updated_at = now() WHERE id = $1", [
        reset.customer_id,
        passwordHash,
      ]);
      await client.query("DELETE FROM sessions WHERE customer_id = $1", [reset.customer_id]);
    });
    res.json({ ok: true, message: "Password updated. Please log in with your new password." });
  })
);

module.exports = router;

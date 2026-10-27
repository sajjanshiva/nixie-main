// Login sessions stored in the database. The cookie holds a random token;
// the database only stores its hash, so a database leak can't be used to log in.
const { query } = require("../db/pool");
const { randomToken, hashToken } = require("../lib/crypto");
const env = require("../config/env");
const C = require("../config/constants");

const COOKIE = { customer: C.CUSTOMER_COOKIE, admin: C.ADMIN_COOKIE };
const LIFETIME_MS = {
  customer: C.CUSTOMER_SESSION_DAYS * 24 * 60 * 60 * 1000,
  admin: C.ADMIN_SESSION_HOURS * 60 * 60 * 1000,
};

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax", // browser only talks to thenixie.in (Vercel rewrite), so Lax works
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

/** Creates a NEW session (new id on every login) and sets the cookie. */
async function startSession(res, req, type, userId) {
  // Drop any old session from this browser first (prevents session fixation).
  const old = req.cookies?.[COOKIE[type]];
  if (old) await query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(old)]);

  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + LIFETIME_MS[type]);
  const column = type === "customer" ? "customer_id" : "admin_id";
  await query(
    `INSERT INTO sessions (token_hash, user_type, ${column}, expires_at) VALUES ($1, $2, $3, $4)`,
    [hashToken(token), type, userId, expiresAt]
  );
  res.cookie(COOKIE[type], token, cookieOptions(LIFETIME_MS[type]));
}

async function endSession(res, req, type) {
  const token = req.cookies?.[COOKIE[type]];
  if (token) await query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
  res.clearCookie(COOKIE[type], cookieOptions());
}

/** Logs a user out everywhere (used after a password change/reset). */
async function endAllSessions(type, userId) {
  const column = type === "customer" ? "customer_id" : "admin_id";
  await query(`DELETE FROM sessions WHERE ${column} = $1`, [userId]);
}

async function findCustomerBySession(token) {
  const { rows } = await query(
    `SELECT c.* FROM sessions s
       JOIN customers c ON c.id = s.customer_id
      WHERE s.token_hash = $1 AND s.user_type = 'customer' AND s.expires_at > now()`,
    [hashToken(token)]
  );
  return rows[0] || null;
}

async function findAdminBySession(token) {
  const { rows } = await query(
    `SELECT a.id, a.email FROM sessions s
       JOIN admins a ON a.id = s.admin_id
      WHERE s.token_hash = $1 AND s.user_type = 'admin' AND s.expires_at > now()`,
    [hashToken(token)]
  );
  return rows[0] || null;
}

module.exports = {
  COOKIE,
  startSession,
  endSession,
  endAllSessions,
  findCustomerBySession,
  findAdminBySession,
  cookieOptions,
};

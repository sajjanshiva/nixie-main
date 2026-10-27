// Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD, only if no admin exists.
const bcrypt = require("bcryptjs");
const { query } = require("../db/pool");
const env = require("../config/env");
const C = require("../config/constants");

async function ensureAdmin() {
  const { rows } = await query("SELECT count(*)::int AS n FROM admins");
  if (rows[0].n > 0) return;
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.warn("[admin] No admin exists. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env and restart.");
    return;
  }
  if (env.ADMIN_PASSWORD.length < C.ADMIN_PASSWORD_MIN) {
    console.warn(`[admin] ADMIN_PASSWORD must be at least ${C.ADMIN_PASSWORD_MIN} characters. Admin not created.`);
    return;
  }
  const hash = await bcrypt.hash(env.ADMIN_PASSWORD, C.BCRYPT_ROUNDS);
  await query("INSERT INTO admins (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING", [
    env.ADMIN_EMAIL.toLowerCase(),
    hash,
  ]);
  console.log(`[admin] First admin created: ${env.ADMIN_EMAIL.toLowerCase()}`);
}

module.exports = { ensureAdmin };

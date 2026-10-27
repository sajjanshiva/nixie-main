// One shared connection pool to Neon. Always use parameterized queries:
//   query("SELECT * FROM leads WHERE id = $1", [id])   ✅
// Never build SQL by joining strings with user input. ❌
const { Pool } = require("pg");
const env = require("../config/env");

const isLocal = /localhost|127\.0\.0\.1/.test(env.DATABASE_URL);

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: true },
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000, // Neon can take a few seconds to wake up
});

pool.on("error", (err) => {
  console.error("[db] Idle client error:", err.message);
});

async function query(text, params = []) {
  return pool.query(text, params);
}

/**
 * Runs fn(client) inside a transaction. Rolls back automatically on error.
 * Use client.query(...) inside fn, never the global query().
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };

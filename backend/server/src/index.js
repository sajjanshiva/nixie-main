// Server start: env check → database check → first admin → pricing data → jobs → listen.
const env = require("./config/env");
const app = require("./app");
const { pool } = require("./db/pool");
const { ensureAdmin } = require("./services/adminBootstrap");
const pricingSheet = require("./services/pricingSheet");
const { startCleanupJob } = require("./jobs/cleanup");

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("[db] Connected");
  } catch (err) {
    console.error("[db] Could not connect to the database:", err.message);
    process.exit(1);
  }

  try {
    await ensureAdmin();
  } catch (err) {
    console.error("[admin] Setup failed (did you run schema.sql?):", err.message);
  }

  // Pricing loads in the background; analyses retry loading if it isn't ready yet.
  pricingSheet.refresh();
  pricingSheet.startAutoRefresh();

  startCleanupJob();

  const server = app.listen(env.PORT, () => {
    console.log(`[server] Nixie API running on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(() => pool.end().finally(() => process.exit(0)));
    setTimeout(() => process.exit(0), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

process.on("unhandledRejection", (err) => console.error("[server] Unhandled rejection:", err));

start();

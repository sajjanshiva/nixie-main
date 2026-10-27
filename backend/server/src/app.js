// Express app: security middleware, then routes.
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const { originCheck } = require("./middleware/originCheck");
const { globalLimiter } = require("./middleware/rateLimits");
const { loadCustomer } = require("./middleware/auth");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();

// Behind Vercel (rewrite) + Render's proxy: trust that many hops so req.ip is the visitor's IP.
app.set("trust proxy", env.TRUST_PROXY_HOPS);
app.disable("x-powered-by");

// Security headers. This server only returns JSON, so the CSP is fully locked down.
// (The website's own CSP/HSTS headers are set in Next.js on Vercel.)
app.use(
  helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginResourcePolicy: { policy: "same-site" },
    hsts: env.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
  })
);

// CORS: only our site. (In production the browser calls thenixie.in/api via the
// Vercel rewrite, so most requests are same-origin; this covers local dev too.)
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || env.allowedOrigins.includes(origin)),
    credentials: true,
  })
);

// Health check (for uptime pings / the cron job that keeps Render awake). Before limits.
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api", globalLimiter);

// Cashfree webhook needs the RAW body → mounted BEFORE express.json().
app.use("/api/payments/webhook", require("./routes/webhooks"));

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api", originCheck); // CSRF: data-changing requests must come from our site

// Private, per-user responses should never be cached.
app.use(["/api/me", "/api/auth", "/api/pay"], (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Admin (own cookie, own checks)
app.use("/api/admin", require("./routes/admin"));

// Customer + public routes (req.customer is set when logged in)
app.use("/api", loadCustomer);
app.use("/api/meta", require("./routes/meta"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/me", require("./routes/me"));
app.use("/api/analyses", require("./routes/analyses"));
app.use("/api/leads", require("./routes/leads"));
app.use("/api/gallery", require("./routes/gallery"));
app.use("/api/pay", require("./routes/pay"));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

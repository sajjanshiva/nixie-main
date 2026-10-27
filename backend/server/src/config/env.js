// Loads and validates every environment variable once, at startup.
// If something required is missing, the server stops with a clear list
// instead of crashing later in the middle of a request.
require("dotenv").config();
const { z } = require("zod");

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  // URLs
  FRONTEND_URL: z.string().url(), // e.g. https://thenixie.in (no trailing slash)
  BACKEND_PUBLIC_URL: z.string().url(), // e.g. https://nixie-api.onrender.com (Cashfree webhook goes here)
  EXTRA_ALLOWED_ORIGINS: z.string().optional().default(""), // comma-separated, e.g. http://localhost:3000
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(2), // Vercel rewrite + Render = 2

  // Database
  DATABASE_URL: z.string().min(1),

  // Sessions / tokens
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),

  // First admin (only used when no admin exists yet)
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional(),

  // Google login
  GOOGLE_CLIENT_ID: z.string().min(1),

  // Gemini
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),

  // Cloudflare Workers AI
  CLOUDFLARE_ACCOUNT_ID: z.string().optional().default(""),
  CLOUDFLARE_API_TOKEN: z.string().optional().default(""),

  // Cashfree
  CASHFREE_APP_ID: z.string().optional().default(""),
  CASHFREE_SECRET_KEY: z.string().optional().default(""),
  CASHFREE_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  CASHFREE_API_VERSION: z.string().default("2023-08-01"),

  // Email (Brevo API or SMTP fallback)
  BREVO_API_KEY: z.string().optional().default(""),
  BREVO_SENDER_EMAIL: z.string().optional().default(""),
  BREVO_SENDER_NAME: z.string().default("NIXIE"),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().default(465),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  EMAIL_FROM_NAME: z.string().default("NIXIE"),

  // ImageKit
  IMAGEKIT_PUBLIC_KEY: z.string().optional().default(""),
  IMAGEKIT_PRIVATE_KEY: z.string().optional().default(""),
  IMAGEKIT_URL_ENDPOINT: z.string().url().optional().default("https://ik.imagekit.io/placeholder"),
  IMAGEKIT_ROOT_FOLDER: z.string().default("/nixie"),

  // Google Sheets (pricing data)
  GOOGLE_SHEET_ID: z.string().optional().default(""),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional().default(""),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().optional().default(""),
  PRICING_REFRESH_INTERVAL_MINUTES: z.coerce.number().int().positive().default(15),

  // Business contact details shown in emails (change anytime)
  CONTACT_EMAIL: z.string().email().default("aishwarya@thenixie.in"),
  CONTACT_PHONE: z.string().default("1234567890"),
  INSTAGRAM_URL: z.string().url().default("https://instagram.com/thenixie.in"),

  // Safety cap on total guest analyses per day (protects the Gemini key)
  GUEST_ANALYSIS_DAILY_CAP: z.coerce.number().int().positive().default(300),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("\n[env] Missing or invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error("\nCopy .env.example to .env and fill in the values.\n");
  process.exit(1);
}

const env = parsed.data;
env.FRONTEND_URL = env.FRONTEND_URL.replace(/\/+$/, "");
env.BACKEND_PUBLIC_URL = env.BACKEND_PUBLIC_URL.replace(/\/+$/, "");
env.isProduction = env.NODE_ENV === "production";
env.allowedOrigins = [
  env.FRONTEND_URL,
  ...env.EXTRA_ALLOWED_ORIGINS.split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean),
];

module.exports = env;

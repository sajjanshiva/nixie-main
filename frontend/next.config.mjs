// Next.js config
//  • /api/* is forwarded to the Express backend on Render, so the browser only
//    ever talks to thenixie.in and login cookies work everywhere (incl. iPhone Safari).
//  • Security headers (CSP, HSTS…) for the website are set here.

const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");
const IMAGE_HOST = process.env.NEXT_PUBLIC_IMAGE_HOST || "ik.imagekit.io";
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // Next.js needs inline scripts. Google sign-in + Cashfree load their own scripts.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://accounts.google.com/gsi/client https://sdk.cashfree.com`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  `img-src 'self' data: blob: https://${IMAGE_HOST} https://ik.imagekit.io https://*.googleusercontent.com`,
  "font-src 'self'",
  "connect-src 'self' https://accounts.google.com/gsi/ https://sdk.cashfree.com https://*.cashfree.com",
  "frame-src https://accounts.google.com/gsi/ https://sdk.cashfree.com https://*.cashfree.com",
  "form-action 'self' https://*.cashfree.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://sdk.cashfree.com\")" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    qualities: [75, 95],
    // Images from ImageKit use our own loader (lib/imagekitLoader.js), so ImageKit
    // does the resizing. These patterns are only a safety net.
    remotePatterns: [
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: IMAGE_HOST },
    ],
  },
  experimental: {
    proxyTimeout: 60_000, // 60s timeout for backend rewrites (prevents ECONNRESET on AI calls)
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Admin pages are hidden from Google
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/admin", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      // Private pages are never cached by the browser or a CDN.
      ...["/admin", "/admin/:path*", "/profile", "/pay/:path*", "/contact", "/login", "/signup", "/reset-password", "/forgot-password"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "no-store" }],
      })),
    ];
  },
};

export default nextConfig;

// Keeps private pages out of Google.
export default function robots() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/profile", "/login", "/signup", "/forgot-password", "/reset-password", "/pay/", "/contact", "/analysis/", "/api/"],
      },
    ],
    host: site,
  };
}

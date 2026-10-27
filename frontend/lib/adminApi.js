// Admin calls: same helper as the site, plus "session expired → back to the admin login".
import { api } from "./api";

export async function adminApi(path, opts) {
  try {
    return await api(`/admin${path}`, opts);
  } catch (err) {
    if (err.status === 401 && err.code === "ADMIN_AUTH_REQUIRED" && typeof window !== "undefined") {
      const here = window.location.pathname + window.location.search;
      if (!here.startsWith("/admin/login")) {
        window.location.href = `/admin/login?next=${encodeURIComponent(here)}`;
      }
    }
    throw err;
  }
}

/** "1,299.50" → 129950 paise, or null. Empty → null. */
export function toPaise(text) {
  const clean = String(text ?? "").replace(/[,\s₹]/g, "");
  if (!clean) return null;
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  const [whole, frac = ""] = clean.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}

/** 129950 → "1299.50", 130000 → "1300" (for editing in an input) */
export function paiseToInput(p) {
  if (p === null || p === undefined) return "";
  return p % 100 === 0 ? String(p / 100) : (p / 100).toFixed(2);
}

/** Local date (IST) as YYYY-MM-DD */
export function isoDay(d) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
  return f.format(d);
}

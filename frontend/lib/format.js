// Display helpers. Money from invoices is in PAISE; the AI estimate is in whole RUPEES.

const inr0 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 13100 → "₹13,100" */
export function rupees(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return inr0.format(Number(value));
}

/** 129950 → "₹1,299.50", 130000 → "₹1,300" */
export function paise(value) {
  if (value === null || value === undefined) return "—";
  const v = Number(value);
  return v % 100 === 0 ? inr0.format(v / 100) : inr2.format(v / 100);
}

/** Rupee text typed by admin ("1,299.50") → integer paise (129950), or null if invalid. */
export function rupeesToPaise(text) {
  const clean = String(text ?? "").replace(/[,\s₹]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const [whole, frac = ""] = clean.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** ISO → "17 Oct 2026" (IST) */
export function date(iso) {
  return iso ? dateFmt.format(new Date(iso)) : "—";
}
/** ISO → "17 Oct 2026, 4:05 pm" (IST) */
export function dateTime(iso) {
  return iso ? dateTimeFmt.format(new Date(iso)) : "—";
}

/** "3 hours ago" style, for dashboards and lists */
export function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return date(iso);
}

export function firstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "";
}

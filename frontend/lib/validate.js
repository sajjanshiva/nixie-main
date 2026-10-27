// Same rules as the backend (so customers see mistakes before sending).
// The backend still checks everything again.

export function cleanPhone(v) {
  return String(v || "").trim().replace(/[\s-]/g, "").replace(/^(\+91|0)/, "");
}

export function validateContact(v, { requireEmail = true } = {}) {
  const e = {};
  if (!String(v.name || "").trim()) e.name = "Name is required";
  if (!/^[6-9]\d{9}$/.test(cleanPhone(v.phone))) e.phone = "Enter a valid 10-digit mobile number";
  if (requireEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v.email || "").trim())) e.email = "Enter a valid email";
  if (String(v.addressLine || "").trim().length < 3) e.addressLine = "Address is required";
  if (String(v.city || "").trim().length < 2) e.city = "City is required";
  if (!v.state) e.state = "Select a state";
  if (!/^[1-9]\d{5}$/.test(String(v.pincode || "").trim())) e.pincode = "Enter a valid 6-digit pincode";
  return e;
}

export function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

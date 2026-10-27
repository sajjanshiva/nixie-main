// Shared Zod pieces. Zod objects drop any unexpected fields automatically.
const { z } = require("zod");
const C = require("../config/constants");
const STATES = require("../config/indianStates");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email")
  .max(254);

const phone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));

const name = z.string().trim().min(1, "Name is required").max(100);

const address = {
  addressLine: z.string().trim().min(3, "Address is required").max(300),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.enum(STATES, { errorMap: () => ({ message: "Select a state" }) }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
};

const customerPassword = z
  .string()
  .min(C.CUSTOMER_PASSWORD_MIN, `Password must be at least ${C.CUSTOMER_PASSWORD_MIN} characters`)
  .max(C.PASSWORD_MAX);

const adminPassword = z
  .string()
  .min(C.ADMIN_PASSWORD_MIN, `Password must be at least ${C.ADMIN_PASSWORD_MIN} characters`)
  .max(C.PASSWORD_MAX);

const uuid = z.string().uuid("Invalid id");

const token = z.string().regex(/^[A-Za-z0-9_-]{20,128}$/, "Invalid link");

/** Optional text field: "" or missing → null */
const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

module.exports = { z, email, phone, name, address, customerPassword, adminPassword, uuid, token, optionalText };

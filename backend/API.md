# Nixie API reference

The frontend is built from this file. All routes start with `/api`.

## Basics

- **How the browser calls the API:** the browser calls `https://thenixie.in/api/...`. A Next.js rewrite forwards the call to the Render server, so the browser only ever talks to thenixie.in and login cookies work everywhere (including Safari on iPhone).
- **Cookies:** always send requests with `credentials: "include"`.
- **Login cookies:**
  - `nixie_customer`: customer login, lasts 30 days
  - `nixie_admin`: admin login, lasts 24 hours
  - Both are httpOnly, so JavaScript can never read them.
- **JSON:** send JSON bodies with `Content-Type: application/json`.
- **Uploads:** send uploads as `multipart/form-data`. Don't set the Content-Type header yourself; the browser adds it.
- **Money:**
  - Invoices and payments are always **integers in paise**. ₹1,299.50 = `129950`. The frontend converts what admin types (rupees) to paise before sending.
  - The AI analysis price is `estimatedPrice`, in **whole rupees**.
- **Dates:** ISO strings in UTC. Display them in IST.

### Errors

Every error has the same shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Enter a valid 6-digit pincode", "fields": { "pincode": "Enter a valid 6-digit pincode" } } }
```

- `message` is always safe to show to the user.
- `fields` only appears on `VALIDATION_ERROR`. Use it to show an error under each form field.
- Common codes:
  - `AUTH_REQUIRED` (401): send the customer to /login
  - `ADMIN_AUTH_REQUIRED` (401): send the admin to /admin/login
  - `RATE_LIMITED` (429)
  - `NOT_FOUND` (404)
  - `UPLOAD_ERROR` (400 or 413)
  - `SERVER_ERROR` (500)

### Shared shapes

**Customer**
```json
{ "id": "uuid", "email": "a@b.com", "name": "Shiva", "phone": "9876543210",
  "addressLine": "12 MG Road", "city": "Nagpur", "state": "Maharashtra", "pincode": "440033",
  "hasPassword": true, "hasGoogle": false }
```

**Analysis**
```json
{ "id": "uuid", "imageUrl": "https://ik.imagekit.io/...", "outfitType": "Mermaid gown with train",
  "primaryFabric": "Embroidered net", "secondaryFabrics": ["Sequin", "Satin"],
  "aiComment": "Such a lovely, elegant gown!", "estimatedPrice": 13100, "createdAt": "..." }
```

**Lead**
```json
{ "id": "uuid", "type": "ai_analysis | general", "name": "", "phone": "", "email": "",
  "addressLine": "", "city": "", "state": "", "pincode": "", "message": "or null",
  "photoUrl": "uploaded enquiry photo or null",
  "analysis": { "id": "", "imageUrl": "", "outfitType": "", "primaryFabric": "", "secondaryFabrics": [], "estimatedPrice": 13100 },
  "galleryImage": { "id": "", "title": "", "imageUrl": "", "slug": "" },
  "createdAt": "" }
```
- `analysis` is null unless `type` is `ai_analysis`.
- `galleryImage` is null unless the enquiry came from a gallery image.

**GalleryImage**
```json
{ "id": "uuid", "slug": "red-bridal-lehenga-3f9a1c", "title": "", "description": "or null",
  "tags": ["lehenga", "bridal"], "imageUrl": "", "width": 1200, "height": 1600, "createdAt": "" }
```
`width` and `height` let the masonry grid reserve space before the image loads.

---

## Public

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | `{ ok: true }`. Use this for the keep-awake cron ping. |
| GET | `/api/meta` | `{ contactEmail, contactPhone, instagramUrl, googleClientId, cashfreeMode, states[], limits{...}, gst{...} }`. `states` fills every State dropdown. |

## Customer auth: `/api/auth`

| Method | Route | Body | Response / notes |
|---|---|---|---|
| GET | `/session` | — | `{ customer }` or `{ customer: null }`. Never returns 401. Use it to show Login vs Profile. |
| POST | `/signup` | `{ email, password (min 8), name? }` | `{ ok, message }`. Always the same message, even when the email already has an account (no account enumeration). Then show the OTP screen. |
| POST | `/signup/resend` | `{ email }` | `{ ok, message }`. 429 `OTP_TOO_SOON` comes with `retryAfterSeconds`. Max 5 codes per hour (`OTP_LIMIT`). Unlock the Resend button after 60 s. |
| POST | `/signup/verify` | `{ email, code }` | `{ customer }` and the customer is logged in. See the error codes below. |
| POST | `/login` | `{ email, password }` | `{ customer }`. 401 `INVALID_CREDENTIALS`. 429 after 10 wrong tries in 15 min. |
| POST | `/google` | `{ credential }` | `{ customer }`. `credential` is the ID token from Google Identity Services ("Sign in with Google" button). |
| POST | `/logout` | — | `{ ok }` |
| POST | `/forgot` | `{ email }` | `{ ok, message }`. Always the same message. The emailed link is `/reset-password?token=...`. |
| POST | `/reset` | `{ token, password }` | `{ ok, message }`. Logs out every session. 400 `RESET_INVALID`. |

Error codes from `/signup/verify`:
- `INVALID_CODE`, with `attemptsLeft`
- `CODE_EXPIRED`
- `CODE_LOCKED`: 5 wrong tries, so the customer needs a new code
- `ACCOUNT_EXISTS`

## Customer profile: `/api/me` (login required)

| Method | Route | Body | Response |
|---|---|---|---|
| GET | `/` | — | `{ customer }` |
| PATCH | `/` | `{ name, phone, addressLine, city, state, pincode }` | `{ customer }`. Email can't be changed. |
| GET | `/analyses?page=` | — | `{ analyses: Analysis[], hasMore }` (My analyses) |
| GET | `/leads?page=` | — | `{ leads: Lead[], hasMore }` (My enquiries) |
| GET | `/invoices` | — | `{ invoices: [{ label, status, token, totals, sentAt, paidAt }] }`. Matched by the account email. Open each at `/pay/{token}`. |

## AI outfit analysis: `/api/analyses`

| Method | Route | Body | Response / notes |
|---|---|---|---|
| GET | `/limit` | — | `{ loggedIn, limit, period: "day"/"hour", remaining }` |
| POST | `/` | multipart `photo` | 201 `{ analysis }`. Works with or without login. See the errors below. |
| GET | `/:id` | — | `{ analysis }`. A linked analysis is only visible to its owner. A guest analysis is visible by its id. |
| POST | `/:id/claim` | — | Login required. Links a guest analysis to the account, so it appears in My analyses. |

Errors from `POST /`:
- 429 `GUEST_LIMIT`: show "Log in to continue"
- 429 `USER_LIMIT`
- 503 `AI_BUSY`: show "Our AI is busy, please try again in a minute." This attempt is **not** counted.
- 422 `PRICE_UNAVAILABLE`: friendly message, offer the Contact button
- 503 `PRICING_UNAVAILABLE`
- 502 `AI_ERROR`
- 400 `INVALID_IMAGE` / `PHOTO_REQUIRED`
- 413: file larger than 10 MB

**Guest flow (frontend):**
1. Keep only the analysis **id** in `sessionStorage`, plus a flag like `openContactAfterLogin=1`.
2. After login, call `POST /api/analyses/:id/claim`.
3. Open `/contact?analysis=<id>`.
4. The summary card loads with `GET /api/analyses/:id`.
5. Clear `sessionStorage` after the form is sent.

## Contact form: `/api/leads` (login required)

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/` | multipart fields: `name, phone, email, addressLine, city, state, pincode, message?` plus **one** of `analysisId` / `galleryImageId`, or neither. Optional file `photo`, used only when there's no analysis or gallery image. | 201 `{ lead }` |

- The server reads outfit, fabrics and price from the database, never from the browser.
- It also saves name, phone and address to the profile, so they're prefilled next time.
- 429 `LEAD_LIMIT`: max 5 per hour.
- Phone is a 10-digit Indian mobile. `+91`, spaces and dashes are accepted and stripped.

## Gallery (public): `/api/gallery`

| Method | Route | Response |
|---|---|---|
| GET | `/?q=&tag=&page=&limit=` | `{ images: GalleryImage[], hasMore, page }`. Newest first. With `q`, the best matches come first. Covers partial words, typos, and alternate names via tags. Default limit 24, max 48. |
| GET | `/tags` | `{ tags: [{ tag, count }] }`, the top 12, for the tag chips |
| GET | `/:slug` | `{ image, moreLikeThis: GalleryImage[] }`. 404 if the image was deleted. |

## Invoice checkout (no login): `/api/pay`

| Method | Route | Body | Response |
|---|---|---|---|
| GET | `/:token` | — | `{ invoice }`, see the shape below. 404 for a bad link. |
| POST | `/:token/orders` | `{ option: "full"/"half"/"balance", name, phone, addressLine, city, state, pincode }` | 201 `{ orderId, paymentSessionId, amountPaise, cashfreeMode }`. Then open the Cashfree checkout: `cashfree.checkout({ paymentSessionId, redirectTarget: "_self" })` using `@cashfreepayments/cashfree-js` with `mode = cashfreeMode`. |
| GET | `/:token/orders/:orderId` | — | `{ result: "paid"/"pending"/"failed", invoice }`. Cashfree sends the customer back to `/pay/<token>?order_id=<id>`. Call this to show "Payment successful" or "Payment failed, try again". |

Errors from `POST /:token/orders`:
- 409 `INVOICE_CANCELLED`
- 409 `INVOICE_PAID`
- 409 `BALANCE_ONLY`
- 502 `PAYMENT_START_FAILED`

If `result` is `pending`, poll every 2–3 seconds, up to about 20 seconds.

**Public invoice shape:**
```json
{ "label": "NX-0013", "status": "sent | partially_paid | paid | cancelled", "token": "...",
  "customer": { "name", "email", "phone" },
  "billing": { "name", "phone", "addressLine", "city", "state", "pincode" },
  "items": [{ "name", "quantity", "unitPricePaise", "linePaise" }],
  "discount": { "amountPaise", "reason" } | null,
  "shipping": { "name", "pricePaise" } | null,
  "totals": { "subtotalPaise", "discountPaise", "gstPaise", "shippingPaise", "totalPaise", "paidPaise", "balancePaise" },
  "payOptions": { "fullPaise", "halfPaise" } | { "balancePaise" } | null,
  "sentAt", "paidAt" }
```
- If cancelled, only `{ label, status, token }` comes back: show "This invoice is no longer valid."
- If `paid`, `payOptions` is null: show "This invoice is already paid."
- The `billing` fields prefill the checkout form.

---

## Admin: `/api/admin` (admin cookie required, except login, forgot and reset)

### Auth: `/api/admin/auth`

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/login` | `{ email, password }` | `{ admin: { id, email } }`. 401 `INVALID_CREDENTIALS`. 423 `LOCKED` after 5 wrong tries (15 min). |
| POST | `/logout` | — | `{ ok }` |
| GET | `/me` | — | `{ admin }` or 401. Use it to guard /admin pages. |
| POST | `/forgot` | `{ email }` | `{ ok, message }`. The emailed link is `/admin/reset-password?token=...`. |
| POST | `/reset` | `{ token, password (min 12) }` | `{ ok, message }` |

### Dashboard

`GET /api/admin/dashboard` returns:
```json
{ "stats": { "newLeadsThisWeek": 3, "unpaidInvoices": { "count", "amountPaise" },
             "balanceDue": { "count", "amountPaise" }, "receivedThisMonthPaise": 0 },
  "recentLeads": [{ "id", "type", "name", "createdAt" }],
  "recentPayments": [{ "id", "invoiceId", "invoiceLabel", "customerName", "amountPaise", "kind", "method", "invoiceStatus", "paidAt" }] }
```

### Leads

| Method | Route | Response |
|---|---|---|
| GET | `/leads?type=ai_analysis/general&q=&page=&limit=` | `{ leads: Lead[], hasMore, page }`. Latest first. `q` searches name, email and phone. |
| GET | `/leads/:id` | `{ lead }` |
| DELETE | `/leads/:id` | `{ ok }` |

### Invoices

Item input: `{ name, unitPricePaise, quantity, gstRate: 5 | 18 | null }`. `null` means **automatic**: 5% if the price per piece after discount is ≤ ₹2,500, otherwise 18%.

Discount input: `{ type: "amount", amountPaise, reason? }` or `{ type: "percent", percent, reason? }`

Shipping input: `{ name, pricePaise }` (0 = free, no GST)

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/invoices/calculate` | `{ items, discount?, shipping? }` | Live totals for the create page. Nothing is saved. `{ lines[{..., gstRate, gstAuto, suggestedRate}], subtotalPaise, discountPaise, gstPaise, shippingPaise, totalPaise }` |
| GET | `/invoices?status=&q=&page=&limit=` | — | `{ invoices: [{ id, label, status, customerName, customerEmail, totalPaise, paidPaise, createdAt, sentAt }], hasMore, page }`. `q` searches name, email, or number ("NX-0013" or "13"). |
| POST | `/invoices` | `{ customer: { name, email, phone? }, items, discount?, shipping?, internalNote? }` | 201 `{ invoice }`, created as a **draft** |
| GET | `/invoices/:id` | — | `{ invoice }`, the full admin shape below |
| PUT | `/invoices/:id` | same as create | `{ invoice }`. **Drafts only** (409 `NOT_DRAFT`). |
| DELETE | `/invoices/:id` | — | `{ ok }`. Drafts only. |
| GET | `/invoices/from-email` | — | `{ from: "NIXIE <x@gmail.com>" }`, shown read-only in the send popup |
| POST | `/invoices/:id/email-preview` | `{ to, subject?, message? }` | `{ from, to, subject, html }`. Show `html` in a sandboxed `<iframe srcdoc>`. |
| POST | `/invoices/:id/send` | `{ to, subject?, message? }` | `{ invoice, emailSent, warning? }`. The NX number is assigned here. If the email fails, the invoice is still Sent: show `warning`. |
| POST | `/invoices/:id/resend` | — | `{ ok }` |
| POST | `/invoices/:id/cancel` | — | `{ invoice }` (Sent or Partially paid only) |
| POST | `/invoices/:id/duplicate` | — | 201 `{ invoice }`, a new draft |
| POST | `/invoices/:id/record-payment` | `{ note?, state? }` | `{ invoice }`. Records the remaining balance as paid (cash or UPI received outside the site). |
| GET | `/invoices/export.csv?from=YYYY-MM-DD&to=YYYY-MM-DD` | — | CSV download of invoices with money received. Includes state and the GST split by rate for the accountant. |

**Admin invoice shape:**
```json
{ "id", "number", "label": "NX-0013 or null (draft)", "status",
  "customer": { "name", "email", "phone" },
  "items": [{ "id", "name", "unitPricePaise", "quantity", "gstRate", "gstAuto", "basePaise", "discountPaise", "taxablePaise", "gstPaise" }],
  "discount": { "type", "amountPaise", "percent", "reason" } | null,
  "shipping": { "name", "pricePaise" } | null,
  "totals": { "subtotalPaise", "discountPaise", "gstPaise", "shippingPaise", "totalPaise", "paidPaise", "balancePaise" },
  "internalNote", "email": { "to", "subject", "message" },
  "billing": { "name", "phone", "addressLine", "city", "state", "pincode" },
  "payUrl": "https://thenixie.in/pay/... (null while draft) → Copy payment link",
  "payments": [{ "id", "kind": "full|half|balance|manual", "method": "cashfree|manual", "status": "pending|paid|failed", "amountPaise", "note", "createdAt", "paidAt" }],
  "sentAt", "paidAt", "cancelledAt", "createdAt", "updatedAt" }
```

### Gallery

| Method | Route | Body | Response |
|---|---|---|---|
| GET | `/gallery?q=&page=&limit=` | — | `{ images: GalleryImage[], hasMore, page }`, newest first |
| POST | `/gallery/suggest` | multipart `photo` | `{ title, tags[], aiFailed }`. Call it **once per image, one after another**, and show "Suggesting tags… 3 / 5". If `aiFailed`, leave the fields empty for admin. |
| POST | `/gallery` | multipart: `photos` (1–5 files) + `items` = JSON string `[{ title, description?, tags[] }]` in the **same order** as the photos | 201 `{ images }` ("Publish all") |
| PATCH | `/gallery/:id` | `{ title, description?, tags[] }` | `{ image }`. The slug and link stay the same. |
| DELETE | `/gallery/:id` | — | `{ ok }`. Also deletes the image from ImageKit. |

---

## Webhook (server to server, not for the frontend)

`POST /api/payments/webhook` receives Cashfree payment events. The signature is verified. Cashfree is told to call this URL automatically for every order, so nothing needs configuring in the Cashfree dashboard.

# NIXIE: project overview (share this file in every new chat)

Nixie is a made-to-order outfit brand, with its office in Nagpur. This project replaces the Shopify store with:
- a **customer website**: AI outfit price estimate, contact form, inspiration gallery, invoice payment
- an **admin panel**: leads, invoices and Cashfree payments, gallery management

There is **no product catalog and no cart**. Customers send an outfit photo, get an estimate, and contact Nixie. Nixie then sends an invoice, which the customer pays online.

One developer builds and maintains it, with Claude writing most of the code. Zips never include `node_modules`, `.next` or real `.env` files.

---

## 1. Architecture

```
Browser ──► thenixie.in (Next.js on Vercel: customer site + /admin)
               │  next.config rewrite: /api/*  ──►  https://<service>.onrender.com/api/*
               ▼
        Express API (Node.js on Render, free tier) ──► Neon PostgreSQL
               ├─► Gemini (AI analysis + gallery tag suggestions)
               ├─► Google Sheets (pricing data: Fabric / Outfit / Price Brackets tabs)
               ├─► ImageKit (all images)
               ├─► Cashfree PG (invoice payments + webhook)
               └─► Gmail SMTP (emails)
```

- **The backend is always a separate Express server on Render, never inside Next.js.**
- **The browser only calls `thenixie.in/api/...`.** Vercel forwards these calls to Render through a Next.js rewrite. Because of this, login cookies are first-party and work on every browser, including iPhone Safari, which blocks third-party cookies.
- **Render free tier sleeps after about 15 minutes.** A cron job pings `GET /api/health` to keep it awake. Business limits are stored in the database, so a restart doesn't reset them.
- **One database** (Neon), with no separate test database. Use Cashfree sandbox while testing, and delete test rows afterwards.

## 2. Folder structure

```
nixie/
├── server/                     Express backend (this part)
│   ├── db/schema.sql           whole database; run once in Neon, keep updated
│   ├── src/index.js            start: env check → DB → first admin → pricing → jobs → listen
│   ├── src/app.js              middleware order + route mounting
│   ├── src/config/             env.js (validated env), constants.js (ALL business rules), indianStates.js
│   ├── src/db/pool.js          query() + withTransaction()
│   ├── src/lib/                gst.js (invoice maths), crypto, validators (Zod), csv, format, money…
│   ├── src/middleware/         auth, originCheck (CSRF), rateLimits, upload (multer), errorHandler
│   ├── src/services/           gemini, pricing(+Sheet), imagekit, images (sharp), email(+templates),
│   │                           cashfree, payments (confirming payments), sessions, adminBootstrap
│   ├── src/routes/             auth, me, analyses, leads, gallery, pay, webhooks, meta, serializers
│   │   └── admin/              auth, dashboard, leads, invoices, gallery
│   └── src/jobs/cleanup.js     daily cleanup (+ 1 min after every start)
├── web/                        Next.js (customer site + /admin), built in parts 2 and 3
├── API.md                      every route: input, output, errors
├── PROJECT.md                  this file
├── DECISIONS.md                change log after the build
└── README.md                   setup, run, deploy
```

## 3. Customer features and flows

### 3.1 AI outfit analysis (main feature)

1. **Upload:** the customer uploads a photo (JPG/PNG/WEBP, max 10 MB).
2. **Image checks:** the backend checks the **real file type** from the file's bytes, then re-encodes the image with sharp. This removes GPS/EXIF data, fixes rotation, and resizes to 1600 px max.
3. **AI detection:** Gemini returns:
   - the outfit type
   - a primary fabric
   - up to 2 secondary fabrics
   - a short compliment

   **Structured output with enums** forces Gemini to pick names only from the Google Sheet lists. The server then checks the names again.
4. **Price, calculated by our code, never the AI:**
   - `score = primaryFabric + 0.35 × (sum of secondary fabrics) + outfit weight + metreage weight + lining weight`, rounded to 2 decimals
   - The score is matched to a **price bracket**. Price = `min + 80% × (max − min)`, in whole rupees.
   - If the score falls in a **gap between brackets**, the customer sees a friendly `PRICE_UNAVAILABLE` message. The gaps are to be fixed in the sheet.
5. **Save:** the photo goes to ImageKit `/nixie/analyses`, and the row is saved in `analyses`. Guest analyses are saved too, with no customer attached.
6. **Result screen:**
   - photo, outfit, fabrics, compliment, and a single estimated price
   - the estimate note
   - **Contact Us** and **Analyse another** buttons
   - No confidence scores, no price range, no tax mention, and no way to change the detected outfit or fabric

**Limits** (counted in the database, so they survive restarts):
- **Guests:** 3 per 24 hours, by hashed IP. The browser also keeps a soft count.
- **Logged in:** 15 per hour.
- **Whole-site guest cap:** 300 per day (`GUEST_ANALYSIS_DAILY_CAP`).
- **Not counted:** only successful analyses are saved, so "AI busy", errors and price gaps never use up a free try.

**Guest to login flow:**
1. The browser keeps only the analysis id plus an "open contact after login" flag.
2. After login: `POST /analyses/:id/claim`.
3. The contact form opens with the analysis summary card.
4. The server reads outfit, fabrics and price from the database to create the lead.

**Cleanup:** unlinked guest analyses (and their photos) are deleted after 7 days.

### 3.2 Contact form (leads), login required

There are three versions of the form:

| Opened from | What's attached | Photo upload | Lead type |
|---|---|---|---|
| Analysis result | the analysis | hidden | `ai_analysis` |
| Header or floating button | nothing | optional | `general` |
| Gallery "Contact us about this" | the gallery image | hidden | `general` |

- **Fields:** name, phone (10-digit Indian), email, address (address line, city, state from a dropdown, 6-digit pincode), optional message.
- **Saved to profile:** name, phone and address are saved to the customer's profile, so they're prefilled next time.
- **Limit:** 5 per hour per customer.
- **Snapshots:** each lead stores a copy of the outfit, price and image, so it stays readable even if the analysis or gallery image changes later.
- **After sending:** a thank-you message with "what happens next" (frontend). The lead shows in Profile → My enquiries and in Admin → Leads.

### 3.3 Customer accounts

**Ways to log in:**
- **Google:** an ID token, verified with google-auth-library.
- **Email + password:** at signup, the email is verified once with a 6-digit OTP.
  - The OTP lasts 10 minutes and allows 5 wrong tries.
  - Resend unlocks after 60 seconds, with max 5 codes per hour.

**Linking accounts:**
- The same email means the same account.
- Google login links to an existing email account.
- An email signup on a Google-only account adds a password once the OTP is verified.

**Login rules:**
- Wrong-password limit: 10 per 15 minutes.
- Sessions last 30 days. Every login gets a new session id.

**Forgot password:**
- The reset link lasts 30 minutes and works once. Max 3 per hour.
- Resetting the password logs out all sessions.

**No account enumeration:** signup and forgot-password always show the same message. If someone signs up with an email that already has an account, they get an "you already have an account" email instead of a code.

**Profile tabs:**
- **My details:** name, phone and address are editable. Email is shown but not editable.
- **My analyses**
- **My invoices:** matched by the account email. Shows unpaid, partially paid and paid invoices.
- **My enquiries**

### 3.4 Inspiration gallery

- **Layout:** Pinterest-style masonry, newest first, with infinite scroll.
- **Search:** covers title + description + tags.
  - Partial words work (ILIKE).
  - Small typos work (pg_trgm `word_similarity ≥ 0.35`).
  - Alternate names work through tags.
- **Tag chips:** the 12 most popular tags.
- **Each image has its own page:** `/gallery/<slug>`. The slug never changes, even if the title is edited.
  - "More like this": images sharing tags
  - Share button
  - "Contact us about this"

### 3.5 Paying an invoice (no login)

1. **Open the link:** `/pay/<long random token>`. The server checks the status when the page opens.
2. **Checkout form:** the customer enters name, phone and address (state is kept for the accountant), and chooses **Pay full** or **Pay half now**.
   - After a half payment, only the **balance** can be paid. It can be paid anytime, from the same link or Profile → My invoices.
3. **Creating the order:** `POST /pay/:token/orders`. The server:
   - locks the invoice row
   - re-checks the status
   - **calculates the amount itself**
   - creates a Cashfree order (expires in 1 hour), saved as a `pending` payment row
4. **Paying:** Cashfree checkout opens. Cashfree then sends the customer back to `/pay/<token>?order_id=…`, and the frontend calls `GET /pay/:token/orders/:orderId`.
5. **Confirming:** the webhook and the return check both call `syncPayment()`. It:
   - asks Cashfree's API for the real status
   - records the payment **once** (row lock + status check)
   - updates the invoice to Partially paid or Paid
   - sends the confirmation email
6. **No expiry, no reminders, no PDF receipt.** Links work until the invoice is paid or cancelled.

## 4. Admin features

- **Login:**
  - `/admin/login` with email + password (min 12 characters).
  - 5 wrong tries → locked for 15 minutes. Sessions last 24 hours.
  - Single admin, created from `ADMIN_EMAIL`/`ADMIN_PASSWORD` on first start.
  - Separate cookie (`nixie_admin`). Admin pages are noindex and never cached.
- **Dashboard:**
  - Stat cards: new leads (last 7 days), unpaid invoices, balance due, received this month (IST).
  - 5 recent leads and 5 recent payments.
- **Leads:** latest first, type filter, search (name, email, phone), details, delete. No status marking, date filter, or "create invoice from lead".
- **Invoices:** Shopify draft-order style.
  - **Draft:** create, edit or delete. The number (NX-0001…) is assigned **when sent**, so deleted drafts never leave gaps.
  - **Send:** a popup with From (read-only), To, Subject, Message, and Preview.
  - **After sending:**
    - copy payment link
    - resend
    - cancel
    - duplicate (makes a new draft)
    - record payment (marks the remaining balance as paid manually)
  - **Rules:**
    - Sent invoices are **never edited**: cancel and duplicate instead.
    - Only drafts can be deleted.
    - No refunds from admin.
  - **Export:** CSV of invoices with money received, including the billing state and GST split by rate, for the accountant.
- **Gallery:**
  - Upload up to 5 images at once.
  - AI suggests a title and tags, one image per request, with 2 automatic retries if Gemini is busy. If it still fails, the fields stay empty for admin to fill in.
  - Admin reviews the suggestions, then clicks **Publish all**.
  - Edit or delete images. Deleting also removes the image from ImageKit.
- **Not included:** customers list, settings page, admin notification emails, roles, editing FAQs or content.

## 5. GST and money rules (`server/src/lib/gst.js` + `config/constants.js`)

- Prices typed by admin are **before GST**. GST is **added on top**.
- **Rate per item:** 5% if the price **per piece after discount** is ≤ ₹2,500, otherwise 18%.
  - The rate is picked automatically. Admin can override it per item (`gstRate` 5/18, or `null` for automatic).
- **Discount** (₹ amount or %, with a reason the customer sees):
  - Split across items by each item's share of the subtotal (largest remainder, so the paise always add up).
  - GST is calculated on the price after the discount.
- **Shipping:** added as-is, with **no GST** for now (`SHIPPING_HAS_GST: false`).
- **Total** = subtotal − discount + GST + shipping. The customer sees one GST line and "Total (incl. taxes)".
- **Half payment:** the first half rounds **up** to the paisa. The balance gets the rest.
- **All invoice money is stored in paise (integers).** The AI estimate is stored in whole rupees.

## 6. Emails

Emails are sent with Nodemailer + Gmail SMTP (App Password).

- **From:** `NIXIE <SMTP_USER>`. Reply-To is `CONTACT_EMAIL`.
- **Footer of every email:** "Questions? Write to aishwarya@thenixie.in · Call us: …". Change these in `.env`.
- **Emails sent:**
  - signup OTP
  - "account already exists"
  - password reset (customer and admin)
  - invoice (send + resend)
  - payment confirmation (each payment)
- **No admin notifications.**
- **All values are HTML-escaped.**
- Switching to Brevo, Zoho or Workspace later means changing the `SMTP_*` values only.

## 7. Security (all built in)

- **Passwords and tokens:**
  - bcryptjs passwords (cost 12)
  - session, reset and OTP values stored only as HMAC hashes
  - httpOnly + Secure + SameSite=Lax cookies
  - a new session on every login; logout deletes the session
- **CSRF:** data-changing requests whose `Origin` isn't our site are rejected.
- **Input:**
  - Zod validates every input and drops unknown fields.
  - Parameterized SQL only.
  - Request body limit is 1 MB for JSON and 10 MB for images.
- **Who can access what:**
  - Every customer query is scoped to the logged-in customer.
  - Every `/api/admin/*` route goes through `requireAdmin` (except login, forgot and reset).
  - API responses only include the listed fields (`routes/serializers.js`).
- **Uploads:**
  - real type check (file-type)
  - SVG not allowed
  - sharp removes metadata
  - random file names
  - uploads only through the backend
- **Payments:**
  - The server calculates every amount.
  - Webhook signature is verified, and the status is double-checked with Cashfree's API.
  - Each payment is recorded once.
  - The invoice row is locked while paying.
  - The status is checked when the page opens and when Pay is clicked.
- **Rate limits:**
  - In the database: analyses, OTPs, resets, leads, admin lockout.
  - In memory: about 100 requests/min per IP, login tries, bursts.
- **Other:**
  - Helmet headers: locked CSP, HSTS in production, no framing.
  - CSV export protects against formula injection.
  - Production errors are generic, and secrets are never logged.
  - The AI never sets the price. Text inside images is ignored.

## 8. Database (`server/db/schema.sql`)

| Table | What it holds |
|---|---|
| `customers` | Customer accounts. Email is lowercase. |
| `admins` | The admin account, with failed tries and lock time |
| `sessions` | Login sessions (customer or admin) |
| `signup_otps` | OTP codes, one row per send |
| `password_resets` | Reset links |
| `analyses` | AI analyses. `created_as_guest` and `ip_hash` are used for the guest limit. |
| `gallery_images` | Gallery images. `search_text` has a trigram index. |
| `leads` | Contact form submissions, with snapshot columns |
| `invoice_counter` | Next NX number |
| `invoices` | Invoices: money in paise, `billing_*` from checkout, `token` for the link |
| `invoice_items` | Invoice items: rate, auto flag, discount share, taxable, GST |
| `payments` | Each Cashfree attempt or manual record. `cf_order_id` is unique. |

No ORM and no migration files. When the database changes, run the SQL in Neon **and** update schema.sql.

## 9. Content still to provide

- How Nixie Works text, FAQs, and the Quick Link pages (the footer links are static for now)
- Logo files and final fonts (frontend parts)
- Fixing the price-bracket gaps in the Google Sheet
- A paid Gemini key before launch (one free key for now)
- Final contact phone and sending email (`.env`)

## 10. Future items (not built)

- Weekly database backups
- Error monitoring and alerts
- Admin 2FA
- Website analytics
- Moving pricing data from Sheets into admin
- Syncing with the Nixie Dashboard

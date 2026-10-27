# Nixie website (Next.js): customer site + admin panel

One Next.js app for the whole website:
- Customer site → `thenixie.in/...`
- Admin panel  → `thenixie.in/admin/...` (no link on the site, bookmark it)

All business logic lives in the Express backend (`backend/server`).
This app only shows pages and calls `/api/...`.

---

## Project folders

```
nixie-main/
├── backend/server/     Express API (port 4000)
└── frontend/user/      this app (port 3000): customer site + admin
```

The folder name (`user`) doesn't matter. Nothing in the code uses it.

---

## Run locally

1. Start the backend first (`backend/server`, port 4000). In the backend `.env` set:
```
   FRONTEND_URL=http://localhost:3000
   TRUST_PROXY_HOPS=1        # local only. Keep 2 on Render
```
2. In this folder:
```bash
   cp .env.example .env.local     # BACKEND_URL=http://localhost:4000
   npm install
   npm run dev
```
3. Open:
   - Customer site: http://localhost:3000
   - Admin: http://localhost:3000/admin (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the backend `.env`)

---

## Environment variables (`.env.local`, or Vercel → Settings → Environment Variables)

| Key | Local | Production (Vercel) |
|---|---|---|
| `BACKEND_URL` | `http://localhost:4000` | `https://<service>.onrender.com` (no trailing slash) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://thenixie.in` |
| `NEXT_PUBLIC_IMAGE_HOST` | `ik.imagekit.io` | only change for a custom ImageKit domain |

Never commit `.env.local`.

---

## How it connects to the backend

- The browser always calls `thenixie.in/api/...`. `next.config.mjs` forwards it to `BACKEND_URL`,
  so login cookies work on every browser, including iPhone Safari.
- Customer login and admin login use different cookies. Logging in as one never logs out the other.
- Gallery pages are also loaded on the server (for Google and WhatsApp previews), cached for 60 seconds.

---

## Change the look and text

| What | Where |
|---|---|
| Colours, fonts, corner radius, shadows (customer + admin) | `styles/theme.css` |
| Admin colours (sidebar, active item, highlighted stat card) | `styles/theme.css`, "ADMIN PANEL colours" block at the end |
| Website text (hero, How it works, FAQs, quick links, thank-you steps) | `lib/content.js` |
| Logos, hero photos | `public/brand/` |

Change a value in `theme.css` and the whole site + admin updates.

---

## Folders

```
app/
  (site)/              customer pages: home, analysis/[id], contact, login, signup,
                       forgot-password, reset-password, profile, gallery, gallery/[slug], pay/[token]
  admin/
    (auth)/            admin login, forgot-password, reset-password
    (panel)/           dashboard, leads, invoices (list, new, [id]), gallery (list, upload)
  layout.js            root layout (fonts, providers)
components/
  ui/                  shared building blocks (Button, Input, Select, Dialog, Tabs, Badge…)
  site/                customer page sections and features
  admin/               admin screens (dashboard, leads, invoices, gallery, auth)
  providers/           customer login state, /api/meta settings, toast messages
lib/
  api.js               calls /api/... (shared)
  adminApi.js          admin calls (expired session → back to /admin/login)
  content.js           fixed website text
  compress.js          shrinks photos in the browser before upload
  format.js            ₹ and date formatting (IST)
  validate.js          form checks (same rules as the backend)
styles/theme.css       ALL colours and fonts
public/brand/          logos, hero photos
```

Folder names in brackets, like `(site)`, `(auth)`, `(panel)`, `[id]` and `[slug]`, are Next.js special folders.
Keep the brackets.

---

## Admin panel: quick guide

- **Dashboard:** this month's payments, new leads, unpaid invoices, balance due, recent leads and payments.
- **Leads:** all enquiries, newest first. Filter by type, search by name, email or phone. Click to open details. Delete spam.
- **Invoices:**
  - Create → Save draft or Send (preview the real email first).
  - After sending: Copy payment link, Resend, Record payment (cash/UPI, with the customer's state for GST), Cancel, Duplicate.
  - No editing after sending: cancel it and use Duplicate.
  - Export: CSV (opens in Excel) for the accountant. Dates are matched by the day the invoice was sent.
- **Gallery:** upload up to 5 images at a time. AI suggests title and tags, you edit, then Publish all. Edit or delete any image.

---

## Deploy (Vercel)

1. Import the repo and set **Root Directory = `frontend/user`**.
2. Add the environment variables above.
3. Domains: add `thenixie.in` and set `www.thenixie.in` to **redirect** to it.
4. Google Cloud → OAuth client → Authorized JavaScript origins: add `https://thenixie.in`
   (and `http://localhost:3000` for testing).

## After deploying, check

- [ ] Guest limit works per visitor: phone (mobile data) and laptop (Wi-Fi) each get their own 3 free estimates.
      If they share one count, change `TRUST_PROXY_HOPS` on Render.
- [ ] A large photo uploads fine (AI analysis and admin gallery).
- [ ] Google login button appears and works.
- [ ] Test payment (Cashfree sandbox) → status updates to Paid / Partially paid.

## Before going live

- [ ] Add policy pages (Privacy, Terms, Refund/Cancellation, Shipping, Contact) using content from the current Nixie site.
      Footer quick links are names only for now.
- [ ] Switch Cashfree to live keys (from the tech lead) and confirm `thenixie.in` is whitelisted.
- [ ] Final website text in `lib/content.js` approved by the founder (FAQ answers still missing for 4 questions).
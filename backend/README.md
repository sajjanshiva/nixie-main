# Nixie website

- `server/`: Express API (Node.js 22+), deployed on **Render**
- `web/`: Next.js site + admin, deployed on **Vercel** (built in parts 2 and 3)

See **PROJECT.md** for how everything works and **API.md** for every route.

---

## 1. Database (Neon)

1. Create a Neon project (any region in or near India, e.g. Singapore).
2. Open **SQL Editor**, paste the whole of `server/db/schema.sql`, and click **Run**. Do this once, on an empty database.
3. Copy the **pooled** connection string. This is your `DATABASE_URL`.

> **If you need to start fresh:** drop all tables first, or create a new branch in Neon, then run schema.sql again.
> **Later changes:** run the new SQL in Neon **and** update `schema.sql`.

## 2. Keys you need (put them in `server/.env`)

Copy `server/.env.example` to `server/.env`. Each key has a comment saying where to get it. In short:

| Service | What to do |
|---|---|
| **Gmail** | Turn on 2-Step Verification. Then go to Google Account → Security → **App passwords** and create one. `SMTP_USER` = the Gmail address. `SMTP_PASS` = the 16-character app password. |
| **Google login** | Google Cloud Console → APIs & Services → Credentials → **OAuth client ID (Web)**. Under *Authorized JavaScript origins*, add `http://localhost:3000` and `https://thenixie.in`. Copy the Client ID. |
| **Google Sheets** | Use the same pricing sheet as the old widget (tabs: `Fabric`, `Outfit`, `Price Brackets`). Create a **service account** and download its JSON key. **Share the sheet** with the service-account email (Viewer). Copy `client_email` and `private_key` into `.env`, keeping the `\n` in the key. |
| **Gemini** | aistudio.google.com → Get API key |
| **ImageKit** | Dashboard → Developer options → public key, private key, URL endpoint |
| **Cashfree** | Merchant Dashboard → Developers → API keys. Use **Test/Sandbox** keys with `CASHFREE_ENV=sandbox` while testing. |
| **Session secret** | Run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| **First admin** | Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ characters). The admin is created on the first start. |

⚠️ **Create NEW keys for this project.** The old widget zip contained real keys, so don't reuse those. Never put `.env` in Git or a zip.

## 3. Run the backend locally

```bash
cd server
npm install
npm run dev        # http://localhost:4000
```

- Check it's running: open `http://localhost:4000/api/health` and you should see `{ "ok": true }`.
- The terminal should show `[db] Connected`, `[admin] First admin created…` (first time only) and `[pricing] Loaded…`.
- If a key is missing, the server stops and lists exactly which ones.

**Local frontend (part 2):** the Next.js app will forward `/api/*` to `http://localhost:4000` using the same rewrite as production. For local testing, keep `FRONTEND_URL=http://localhost:3000` in `server/.env`.

> **Cashfree webhooks locally:** Cashfree can't reach `localhost`, so the webhook is skipped. This is fine: when the customer returns from Cashfree, the payment page checks the status with Cashfree directly and records the payment.

## 4. Deploy the backend (Render)

1. Push the repo to GitHub. Check that `.env` is **not** committed.
2. In Render, create a **New → Web Service** from the repo.
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
3. Under **Environment**, add every key from `.env`, with these changes for production:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://thenixie.in`
   - `BACKEND_PUBLIC_URL=https://<your-service>.onrender.com`
   - `TRUST_PROXY_HOPS=2`
4. Deploy. Then open `https://<your-service>.onrender.com/api/health` to check it's running.
5. **Keep it awake:** set up your cron job to call `GET https://<your-service>.onrender.com/api/health` every 10 minutes.

## 5. Connect the frontend (Vercel), set up in part 2

`web/next.config.js` will contain this rewrite. This is what makes login cookies work:

```js
async rewrites() {
  return [{ source: "/api/:path*", destination: `${process.env.API_URL}/api/:path*` }];
}
```

Set `API_URL=https://<your-service>.onrender.com` in Vercel (and `http://localhost:4000` locally).

## 6. Going live checklist (later)

- [ ] Cashfree **production** keys + `CASHFREE_ENV=production`
- [ ] Paid Gemini key
- [ ] Price-bracket gaps fixed in the Google Sheet
- [ ] Policy pages live (Google login + Cashfree check for them)
- [ ] Real contact email and phone in `.env`
- [ ] Test leads, invoices and payments deleted from the database
- [ ] `npm audit` run, and Dependabot turned on in GitHub

# Nixie — Bespoke Tailoring Platform & Admin Suite

A bespoke custom-tailoring web platform built with a tailor-atelier aesthetic:
- **Frontend (`frontend/`)**: Next.js 15 (App Router, Tailwind CSS, Motion), deployed on Vercel.
- **Backend (`backend/server/`)**: Node.js & Express API, PostgreSQL (Neon), ImageKit, Google Gemini AI, deployed on Render.

---

## 1. Production Database Setup (Neon PostgreSQL)

To set up or upgrade your production Neon PostgreSQL database for the new **Client Reviews** and atelier features:

1. Open your [Neon Console](https://console.neon.tech).
2. Select your project and navigate to **SQL Editor**.
3. Copy and run the following clean SQL script (pure schema with **zero synthetic/fake data**):

```sql
-- =====================================================================
-- NIXIE — Production Migration for Client Reviews
-- Run this once in Neon SQL Editor
-- =====================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type            text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video')),
  client_name     text NOT NULL,
  client_location text,
  outfit_name     text,
  rating          integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  quote           text NOT NULL,
  media_url       text,
  media_file_id   text,
  aspect_ratio    text NOT NULL DEFAULT 'square' CHECK (aspect_ratio IN ('square', 'tall', 'wide')),
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for fast ordering on the customer-facing mosaic
CREATE INDEX IF NOT EXISTS reviews_active_idx 
  ON reviews (is_active, created_at DESC);
```

*(If setting up a brand-new database from scratch, the full schema including customers, leads, invoices, and gallery is available in `backend/server/db/schema.sql`)*.

---

## 2. Atelier Theme & Architecture

All customer-facing pages follow the handcrafted **Atelier Studio aesthetic**:
- **Palette**: Ivory page canvas (`#fffcf0`), Deep Atelier Teal (`#155f64`), Brand Teal (`#279da4`), Accent Cyan (`#54ebeb`), and Yellow Gold (`#ffc43a`). Managed centrally in `frontend/styles/theme.css`.
- **Typography**: Clean Helvetica for headers and content, with artisan **Caveat** script for handwritten accents and notes.
- **Craft Elements**: 
  - Dynamic **animated measuring tape** scrolling from 0 to 225 cm.
  - Interactive **2-column craft story section**: "Behind the Scenes at Nixie" video player on the left, paired with 3 interactive fabric swatch cards featuring pinked edges, golden pins, handwritten notes, and smooth left/right tilt hover animation.
  - Open, floating canvas without harsh section dividing lines.
  - Atelier stitched button borders (`.stitched-btn`).
  - Minimalist thin-line profile icon.

---

## 3. Admin Panel Features

The admin suite is accessible at `/admin` (desktop sidebar & mobile responsive drawer):

### 🌟 1. Client Reviews (`/admin/reviews`)
- Manage customer feedback shown in the customer mosaic on the homepage.
- **Add Review Modal**:
  - Format options: **Photo Review** (with direct photo upload or image URL), **Video Review** (video file or link), or **Text Quote**.
  - Client name, location (city), and outfit reference.
  - 1–5 star rating picker.
  - Client feedback quote / story.
  - Aspect ratio selector (Tall 3:4, Square 1:1, Wide 16:9).
  - Display ordering number.
- **Live Toggle**: Instantly show or hide any review from the live site with one click (`Active` / `Hidden`).
- **Edit & Delete**: Full CRUD controls with delete confirmation dialogs.

### 🖼️ 2. Inspiration Gallery (`/admin/gallery` & `/admin/gallery/upload`)
- Multi-photo batch upload with Gemini AI automated tag & title suggestions.
- **Curated Category Chips**: Quick selection for standard categories (*Bollywood, Party/Concert, Wedding Guest, Sarees, Festive, Gothic, Latest*) + custom tag support.
- Live search and pagination.

### 📥 3. Leads Management (`/admin/leads`)
- Track incoming customer estimates and quote requests.
- Filter by lead type (AI photo analysis estimates vs general inquiries).

### 🧾 4. Invoices & Payments (`/admin/invoices`)
- Create and send customized GST invoices with itemized line items.
- Full or split payment support (50% advance / balance) integrated with Cashfree.

---

## 4. Running Locally

### 1. Backend Server
```bash
cd backend/server
npm install
npm run dev      # Runs API at http://localhost:4000
```

### 2. Frontend Web App
```bash
cd frontend
npm install
npm run dev      # Runs Next.js at http://localhost:3000
```

Open `http://localhost:3000` for the customer website and `http://localhost:3000/admin` for the admin portal.

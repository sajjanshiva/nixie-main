-- =====================================================================
-- NIXIE — database schema (PostgreSQL / Neon)
-- Run this whole file ONCE in Neon's SQL editor on an empty database.
-- Keep this file updated whenever the database changes.
-- Money for invoices/payments is stored in PAISE (₹1,299.50 → 129950).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- gallery search (partial words + typos)
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- Customers (website accounts: Google and/or email + password)
-- ---------------------------------------------------------------------
CREATE TABLE customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text,                 -- null for Google-only accounts
  google_sub    text UNIQUE,          -- Google account id, null if never used Google login
  name          text,
  phone         text,                 -- 10-digit Indian mobile
  address_line  text,
  city          text,
  state         text,
  pincode       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Admin (single account, created from .env on first start)
-- ---------------------------------------------------------------------
CREATE TABLE admins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash   text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Login sessions (cookie holds a random token; only its hash is stored)
-- ---------------------------------------------------------------------
CREATE TABLE sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash  text NOT NULL UNIQUE,
  user_type   text NOT NULL CHECK (user_type IN ('customer', 'admin')),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  admin_id    uuid REFERENCES admins(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (user_type = 'customer' AND customer_id IS NOT NULL AND admin_id IS NULL) OR
    (user_type = 'admin'    AND admin_id IS NOT NULL AND customer_id IS NULL)
  )
);
CREATE INDEX sessions_customer_idx ON sessions (customer_id);
CREATE INDEX sessions_admin_idx    ON sessions (admin_id);
CREATE INDEX sessions_expires_idx  ON sessions (expires_at);

-- ---------------------------------------------------------------------
-- Signup OTPs (email + password signup, verified once by a 6-digit code)
-- Each send is a row, so "max 5 per hour" can be counted.
-- ---------------------------------------------------------------------
CREATE TABLE signup_otps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL CHECK (email = lower(email)),
  code_hash     text NOT NULL,
  password_hash text NOT NULL,        -- the chosen password, hashed, until verified
  name          text,
  attempts      integer NOT NULL DEFAULT 0,
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX signup_otps_email_idx ON signup_otps (email, created_at DESC);

-- ---------------------------------------------------------------------
-- Password reset links (customers and admin)
-- ---------------------------------------------------------------------
CREATE TABLE password_resets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash  text NOT NULL UNIQUE,
  user_type   text NOT NULL CHECK (user_type IN ('customer', 'admin')),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  admin_id    uuid REFERENCES admins(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (user_type = 'customer' AND customer_id IS NOT NULL AND admin_id IS NULL) OR
    (user_type = 'admin'    AND admin_id IS NOT NULL AND customer_id IS NULL)
  )
);
CREATE INDEX password_resets_customer_idx ON password_resets (customer_id, created_at DESC);
CREATE INDEX password_resets_admin_idx    ON password_resets (admin_id, created_at DESC);

-- ---------------------------------------------------------------------
-- AI outfit analyses (guests too: customer_id is null until they log in)
-- Unlinked guest analyses (+ photos) are deleted after 7 days by a daily job.
-- ---------------------------------------------------------------------
CREATE TABLE analyses (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id            uuid REFERENCES customers(id) ON DELETE CASCADE,
  created_as_guest       boolean NOT NULL,  -- counts toward the guest limit even after linking
  ip_hash                text,              -- hashed IP (never the raw IP), for the guest limit
  image_url              text NOT NULL,
  image_file_id          text NOT NULL,     -- ImageKit file id (to delete the photo later)
  outfit_type            text NOT NULL,
  primary_fabric         text NOT NULL,
  secondary_fabrics      text[] NOT NULL DEFAULT '{}',
  ai_comment             text NOT NULL,
  score                  numeric(10, 2) NOT NULL,
  estimated_price_rupees integer NOT NULL,
  created_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analyses_customer_idx ON analyses (customer_id, created_at DESC);
CREATE INDEX analyses_guest_ip_idx ON analyses (ip_hash, created_at) WHERE created_as_guest;
CREATE INDEX analyses_created_idx  ON analyses (created_at);

-- ---------------------------------------------------------------------
-- Inspiration gallery
-- search_text = lower(title + description + tags), kept up to date by the backend.
-- ---------------------------------------------------------------------
CREATE TABLE gallery_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,      -- page link: /gallery/<slug>
  title         text NOT NULL,
  description   text,
  tags          text[] NOT NULL DEFAULT '{}',  -- lowercase
  search_text   text NOT NULL,
  image_url     text NOT NULL,
  image_file_id text NOT NULL,
  width         integer NOT NULL,
  height        integer NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gallery_search_trgm_idx ON gallery_images USING gin (search_text gin_trgm_ops);
CREATE INDEX gallery_tags_idx        ON gallery_images USING gin (tags);
CREATE INDEX gallery_created_idx     ON gallery_images (created_at DESC, id DESC);

-- ---------------------------------------------------------------------
-- Leads (contact form submissions). Snapshot columns keep what the customer
-- saw, even if the analysis or gallery image changes later.
-- ---------------------------------------------------------------------
CREATE TABLE leads (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id            uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type                   text NOT NULL CHECK (type IN ('ai_analysis', 'general')),
  analysis_id            uuid REFERENCES analyses(id) ON DELETE SET NULL,
  gallery_image_id       uuid REFERENCES gallery_images(id) ON DELETE SET NULL,
  name                   text NOT NULL,
  phone                  text NOT NULL,
  email                  text NOT NULL,
  address_line           text NOT NULL,
  city                   text NOT NULL,
  state                  text NOT NULL,
  pincode                text NOT NULL,
  message                text,
  photo_url              text,               -- photo uploaded with a general enquiry
  photo_file_id          text,
  -- snapshots
  outfit_type            text,
  primary_fabric         text,
  secondary_fabrics      text[],
  estimated_price_rupees integer,
  analysis_image_url     text,
  gallery_title          text,
  gallery_image_url      text,
  created_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_created_idx  ON leads (created_at DESC);
CREATE INDEX leads_customer_idx ON leads (customer_id, created_at DESC);
CREATE INDEX leads_type_idx     ON leads (type, created_at DESC);

-- ---------------------------------------------------------------------
-- Invoice numbers (NX-0001...). Assigned only when an invoice is SENT,
-- so deleted drafts never leave gaps.
-- ---------------------------------------------------------------------
CREATE TABLE invoice_counter (
  id          integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_number integer NOT NULL DEFAULT 0
);
INSERT INTO invoice_counter (id, last_number) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- Invoices (admin-created payment requests, paid via Cashfree)
-- ---------------------------------------------------------------------
CREATE TABLE invoices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number                integer UNIQUE,      -- null while draft
  token                 text NOT NULL UNIQUE, -- long random code in the payment link
  status                text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'cancelled')),
  customer_name         text NOT NULL,
  customer_email        text NOT NULL CHECK (customer_email = lower(customer_email)),
  customer_phone        text,
  discount_type         text CHECK (discount_type IN ('amount', 'percent')),
  discount_input_paise  integer CHECK (discount_input_paise >= 0),   -- for 'amount'
  discount_percent      numeric(5, 2) CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_reason       text,
  shipping_name         text,                -- null = no shipping line
  shipping_paise        integer NOT NULL DEFAULT 0 CHECK (shipping_paise >= 0),
  subtotal_paise        integer NOT NULL DEFAULT 0,
  discount_paise        integer NOT NULL DEFAULT 0,
  gst_paise             integer NOT NULL DEFAULT 0,
  total_paise           integer NOT NULL DEFAULT 0,
  paid_paise            integer NOT NULL DEFAULT 0,
  internal_note         text,                -- admin only
  email_to              text,
  email_subject         text,
  email_message         text,
  -- filled by the customer at checkout (state is kept for the accountant)
  billing_name          text,
  billing_phone         text,
  billing_address_line  text,
  billing_city          text,
  billing_state         text,
  billing_pincode       text,
  sent_at               timestamptz,
  paid_at               timestamptz,
  cancelled_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX invoices_status_idx ON invoices (status, created_at DESC);
CREATE INDEX invoices_email_idx  ON invoices (customer_email);

CREATE TABLE invoice_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  position         integer NOT NULL,
  name             text NOT NULL,
  unit_price_paise integer NOT NULL CHECK (unit_price_paise >= 0),
  quantity         integer NOT NULL CHECK (quantity > 0),
  gst_rate         smallint NOT NULL CHECK (gst_rate IN (5, 18)),
  gst_auto         boolean NOT NULL DEFAULT true,  -- true = rate picked automatically from price
  base_paise       integer NOT NULL,               -- unit price × quantity
  discount_paise   integer NOT NULL DEFAULT 0,     -- this item's share of the invoice discount
  taxable_paise    integer NOT NULL,               -- base − discount
  gst_paise        integer NOT NULL
);
CREATE INDEX invoice_items_invoice_idx ON invoice_items (invoice_id, position);

-- ---------------------------------------------------------------------
-- Payments (each Cashfree attempt or manual record is one row)
-- ---------------------------------------------------------------------
CREATE TABLE payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  kind          text NOT NULL CHECK (kind IN ('full', 'half', 'balance', 'manual')),
  method        text NOT NULL CHECK (method IN ('cashfree', 'manual')),
  status        text NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  amount_paise  integer NOT NULL CHECK (amount_paise > 0),
  cf_order_id   text UNIQUE,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  paid_at       timestamptz
);
CREATE INDEX payments_invoice_idx ON payments (invoice_id, created_at DESC);
CREATE INDEX payments_paid_idx    ON payments (status, paid_at DESC);

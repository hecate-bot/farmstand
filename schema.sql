-- Farm Stand Schema
-- Run: wrangler d1 execute farmstand --file=schema.sql

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'Farm Stand',
  logo_url TEXT DEFAULT '',
  color_primary TEXT DEFAULT '#2D5016',
  color_secondary TEXT DEFAULT '#F5F0E8',
  color_accent TEXT DEFAULT '#8B4513',
  stripe_publishable_key TEXT DEFAULT '',
  stripe_secret_key TEXT DEFAULT '',
  venmo_handle TEXT DEFAULT '',
  admin_password_hash TEXT DEFAULT '',
  apple_pay_domain_file TEXT DEFAULT '',
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_cents INTEGER NOT NULL,
  image_url TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  created_at INTEGER DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL
);

-- Seed default store
INSERT OR IGNORE INTO stores (id, name) VALUES ('default', 'Farm Stand');

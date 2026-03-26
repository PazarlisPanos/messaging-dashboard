-- ============================================================
-- Migration 001 — dashboard_db (central database)
-- Run once: psql $DATABASE_URL -f migrations/001_create_users.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS clients (
  id                   SERIAL PRIMARY KEY,
  slug                 TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  database_url         TEXT NOT NULL,
  wa_webhook           TEXT,         -- n8n manual reply webhook
  vb_webhook           TEXT,         -- n8n Viber reply webhook
  bot_toggle_webhook   TEXT,         -- n8n bot enable/disable webhook
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  email         TEXT,
  password      TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'operator',
  client_slug   TEXT REFERENCES clients(slug) ON UPDATE CASCADE,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dashboard_users_username ON dashboard_users(username);
CREATE INDEX IF NOT EXISTS idx_dashboard_users_client   ON dashboard_users(client_slug);

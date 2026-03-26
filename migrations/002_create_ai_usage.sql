-- ============================================================
-- Migration 002 — per-client database (run on EACH client db)
-- e.g.: psql $CLIENT_DATABASE_URL -f migrations/002_create_ai_usage.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_usage (
  id                BIGSERIAL PRIMARY KEY,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_id        TEXT,                    -- references wa_messages.message_id
  conversation_key  TEXT,                    -- references wa_messages.conversation_key
  sender            TEXT,                    -- the contact (user) identifier
  model             TEXT NOT NULL,           -- e.g. 'gpt-4.1-mini'
  prompt_tokens     INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  total_tokens      INT NOT NULL DEFAULT 0,
  cost_usd          NUMERIC(10,6),           -- computed by n8n before insert
  workflow          TEXT                     -- optional: which n8n workflow
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at       ON ai_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_sender           ON ai_usage(sender);
CREATE INDEX IF NOT EXISTS idx_ai_usage_conversation_key ON ai_usage(conversation_key);

-- ============================================================
-- n8n Postgres node — INSERT template:
-- ============================================================
-- INSERT INTO ai_usage
--   (message_id, conversation_key, sender, model,
--    prompt_tokens, completion_tokens, total_tokens, cost_usd, workflow)
-- VALUES
--   ('{{ $json.message_id }}', '{{ $json.conversation_key }}', '{{ $json.sender }}',
--    'gpt-4.1-mini',
--    {{ $json.usage.prompt_tokens }}, {{ $json.usage.completion_tokens }},
--    {{ $json.usage.total_tokens }},
--    -- cost formula: (prompt * 0.40 + completion * 1.60) / 1_000_000
--    ROUND(({{ $json.usage.prompt_tokens }} * 0.40 + {{ $json.usage.completion_tokens }} * 1.60) / 1000000.0, 6),
--    'wa-main-flow')

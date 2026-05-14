-- ============================================================
-- Add remaining push_outbox columns used by live DB trigger
-- ============================================================

ALTER TABLE public.push_outbox
  ADD COLUMN IF NOT EXISTS payload              jsonb   DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS message              text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS url                  text,
  ADD COLUMN IF NOT EXISTS image                text,
  ADD COLUMN IF NOT EXISTS priority             text    DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS ttl                  integer DEFAULT 86400,
  ADD COLUMN IF NOT EXISTS status               text    DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS attempts             integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempted_at    timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_at         timestamptz DEFAULT now();

-- ============================================================
-- Create push_outbox table
-- Live DB has a trigger referencing this table but it was never
-- created, causing "relation public.push_outbox does not exist"
-- on every page load.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_outbox (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         text        NOT NULL DEFAULT '',
  body          text        NOT NULL DEFAULT '',
  data          jsonb       DEFAULT '{}'::jsonb,
  icon          text,
  badge         text,
  tag           text,
  processed_at  timestamptz,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_outbox ENABLE ROW LEVEL SECURITY;

-- Service role processes outbox; users can read their own entries
CREATE POLICY "Users can read their own push_outbox entries"
  ON public.push_outbox FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_push_outbox_user_id      ON public.push_outbox(user_id);
CREATE INDEX IF NOT EXISTS idx_push_outbox_unprocessed  ON public.push_outbox(created_at) WHERE processed_at IS NULL;

-- Ensure saved_searches exists before adding alerts_enabled.
-- Live DB was missing the table, so the column-only migration failed.

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  search_name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_matched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  alerts_enabled boolean NOT NULL DEFAULT false
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON public.saved_searches (user_id);

ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS alerts_enabled boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'saved_searches' AND policyname = 'Users can view own saved searches'
  ) THEN
    CREATE POLICY "Users can view own saved searches" ON public.saved_searches
      FOR SELECT USING ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'saved_searches' AND policyname = 'Users can insert own saved searches'
  ) THEN
    CREATE POLICY "Users can insert own saved searches" ON public.saved_searches
      FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'saved_searches' AND policyname = 'Users can update own saved searches'
  ) THEN
    CREATE POLICY "Users can update own saved searches" ON public.saved_searches
      FOR UPDATE USING ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'saved_searches' AND policyname = 'Users can delete own saved searches'
  ) THEN
    CREATE POLICY "Users can delete own saved searches" ON public.saved_searches
      FOR DELETE USING ((select auth.uid()) = user_id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

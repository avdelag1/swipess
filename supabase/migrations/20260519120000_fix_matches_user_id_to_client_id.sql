-- ============================================================
-- DATABASE SCHEMA FIX: Rename user_id to client_id in matches table (2026-05-19)
-- ============================================================
-- Establishes client_id and owner_id consistency across matches and conversations tables.
-- Resolves "400 Bad Request" errors caused by mismatched columns and RLS policies.

DO $$ 
BEGIN
  -- 1. Rename user_id column to client_id if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.matches RENAME COLUMN user_id TO client_id;
  END IF;
END $$;

-- 2. Drop existing matches policies to prevent column reference errors
DROP POLICY IF EXISTS "Users can view own matches" ON public.matches;
DROP POLICY IF EXISTS "System can create matches" ON public.matches;
DROP POLICY IF EXISTS "Users can create their own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can update own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can delete own matches" ON public.matches;

-- 3. Re-create secure matches RLS policies using client_id and owner_id
CREATE POLICY "Users can view own matches"
    ON public.matches FOR SELECT
    USING (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create their own matches"
    ON public.matches FOR INSERT
    WITH CHECK (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE POLICY "Users can update own matches"
    ON public.matches FOR UPDATE
    USING (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE POLICY "Users can delete own matches"
    ON public.matches FOR DELETE
    USING (auth.uid() = client_id OR auth.uid() = owner_id);

-- 4. Re-create optimal indexes and constraints
DROP INDEX IF EXISTS idx_matches_unique;
DROP INDEX IF EXISTS idx_matches_unique_with_listing;
DROP INDEX IF EXISTS idx_matches_unique_without_listing;

-- Unique match per client, owner, and listing (when listing is not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_unique_with_listing
    ON public.matches (client_id, owner_id, listing_id)
    WHERE listing_id IS NOT NULL;

-- Unique match per client and owner (when listing is null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_unique_without_listing
    ON public.matches (client_id, owner_id)
    WHERE listing_id IS NULL;

DROP INDEX IF EXISTS idx_matches_client;
CREATE INDEX IF NOT EXISTS idx_matches_client ON public.matches(client_id);

DROP INDEX IF EXISTS idx_matches_pair;
CREATE INDEX IF NOT EXISTS idx_matches_pair ON public.matches (client_id, owner_id);

-- 5. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

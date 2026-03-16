-- ============================================================
-- FORCE USER_ID SCHEMA CACHE REFRESH (2026-03-16)
-- ============================================================
-- Fixes: "Could not find the 'user_id' column of 'listings' in the schema cache"
-- Strategy: ensure column exists, make it nullable, force PostgREST reload.

DO $$
BEGIN
    -- Ensure user_id column exists and is nullable (allows inserts even if cache is stale)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.listings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    ELSE
        -- Make nullable so fallback inserts without it still succeed
        ALTER TABLE public.listings ALTER COLUMN user_id DROP NOT NULL;
    END IF;

    -- Backfill user_id from owner_id where missing
    UPDATE public.listings SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL;

    -- Ensure owner_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.listings ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Grant full access so PostgREST can introspect the table
GRANT ALL ON TABLE public.listings TO authenticated;
GRANT ALL ON TABLE public.listings TO service_role;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

-- Touch schema to guarantee detection of DDL changes
CREATE OR REPLACE VIEW public.listings_cache_ping AS SELECT id FROM public.listings LIMIT 0;
DROP VIEW public.listings_cache_ping;

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- FIX LISTINGS TABLE SCHEMA CACHE (2026-03-15)
-- ============================================================
-- Ensures 'location' and 'user_id' columns exist on listings table
-- and forces PostgREST to reload its schema cache.

DO $$
BEGIN
    -- Add location column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='listings' AND column_name='location') THEN
        ALTER TABLE public.listings ADD COLUMN location text;
    END IF;

    -- Add user_id column if missing (some queries reference it alongside owner_id)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='listings' AND column_name='user_id') THEN
        ALTER TABLE public.listings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
        -- Backfill user_id from owner_id
        UPDATE public.listings SET user_id = owner_id WHERE user_id IS NULL;
    END IF;
END $$;

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

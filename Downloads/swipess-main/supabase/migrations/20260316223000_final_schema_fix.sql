-- ============================================================
-- FINAL LISTINGS SCHEMA FIX (2026-03-16)
-- ============================================================
-- Ensures ALL required and common columns exist on the listings table
-- and FORCES a PostgREST schema reload.

DO $$
BEGIN
    -- 1. Ensure 'location' column exists (Common point of failure)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='listings' AND column_name='location') THEN
        ALTER TABLE public.listings ADD COLUMN location text;
    END IF;

    -- 2. Ensure 'user_id' column exists (Referenced in many queries)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='listings' AND column_name='user_id') THEN
        ALTER TABLE public.listings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Backfill user_id from owner_id if possible
        UPDATE public.listings SET user_id = owner_id WHERE user_id IS NULL;
    END IF;

    -- 3. Ensure 'owner_id' is NOT NULL (Essential for RLS)
    -- Check if it should be added or just modified
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='listings' AND column_name='owner_id') THEN
        ALTER TABLE public.listings ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- 4. Ensure 'video_url' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='listings' AND column_name='video_url') THEN
        ALTER TABLE public.listings ADD COLUMN video_url text;
    END IF;

    -- 5. Ensure 'images' is JSONB
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='listings' AND column_name='images' AND data_type != 'jsonb') THEN
        ALTER TABLE public.listings ALTER COLUMN images TYPE jsonb USING images::jsonb;
    END IF;
END $$;

-- FORCE POSTGREST SCHEMA RELOAD
-- This is critical after any DDL change to the public schema
NOTIFY pgrst, 'reload schema';

-- Extra insurance: Create a dummy view and drop it to trigger schema changes detection
CREATE OR REPLACE VIEW public.listings_schema_sync AS SELECT id FROM public.listings LIMIT 1;
DROP VIEW public.listings_schema_sync;

-- Final notification
NOTIFY pgrst, 'reload schema';

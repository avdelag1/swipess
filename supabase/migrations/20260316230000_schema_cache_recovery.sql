-- ============================================================
-- GLOBAL SCHEMA CACHE RECOVERY (2026-03-16)
-- ============================================================
-- Specifically targets the "Could not find the 'user_id' column" 
-- and "Could not find the 'location' column" errors by:
-- 1. Ensuring columns exist with correct types
-- 2. Making columns nullable temporarily to allow fallback inserts
-- 3. FORCING a hard reload of the PostgREST cache
-- ============================================================

DO $$ 
BEGIN
    -- 1. Ensure user_id exists and is NULLABLE (to support fallback inserts)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'user_id') THEN
        ALTER TABLE public.listings ADD COLUMN user_id UUID REFERENCES auth.users(id);
    ELSE
        ALTER TABLE public.listings ALTER COLUMN user_id DROP NOT NULL;
    END IF;

    -- 2. Ensure location exists and is NULLABLE
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'location') THEN
        ALTER TABLE public.listings ADD COLUMN location text;
    ELSE
        ALTER TABLE public.listings ALTER COLUMN location DROP NOT NULL;
    END IF;

    -- 3. Ensure owner_id exists (as it's used as the primary link in many places)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'owner_id') THEN
        ALTER TABLE public.listings ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- 4. Set owner_id to user_id if one is missing
    UPDATE public.listings SET owner_id = user_id WHERE owner_id IS NULL AND user_id IS NOT NULL;
    UPDATE public.listings SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL;

END $$;

-- 5. RELOAD SCHEMA (Aggressive)
-- We run this multiple times and touch the schema to trigger detection
NOTIFY pgrst, 'reload schema';

-- Create a temporary table and drop it
CREATE TABLE public.tmp_schema_sync (id int);
DROP TABLE public.tmp_schema_sync;

NOTIFY pgrst, 'reload schema';

-- Grant permissions to ensure the API can actually see the columns
GRANT ALL ON TABLE public.listings TO authenticated;
GRANT ALL ON TABLE public.listings TO anon;
GRANT ALL ON TABLE public.listings TO service_role;

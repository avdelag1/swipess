-- Add missing columns that failed to deploy due to skipped migrations

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE public.client_profiles
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS years_in_city INTEGER,
ADD COLUMN IF NOT EXISTS employer_name TEXT;

-- Notify pgrst to reload schema
NOTIFY pgrst, 'reload schema';

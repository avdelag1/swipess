
ALTER TABLE public.client_profiles
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS years_in_city INTEGER,
ADD COLUMN IF NOT EXISTS employer_name TEXT;

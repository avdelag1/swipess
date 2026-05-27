-- Add specific fields for the Virtual ID Card (VAP) to client_profiles
-- This ensures VAP data is isolated and persistent even if a user switches roles

ALTER TABLE public.client_profiles 
  ADD COLUMN IF NOT EXISTS vap_avatar TEXT,
  ADD COLUMN IF NOT EXISTS vap_bio TEXT,
  ADD COLUMN IF NOT EXISTS vap_occupation TEXT,
  ADD COLUMN IF NOT EXISTS vap_city TEXT,
  ADD COLUMN IF NOT EXISTS vap_nationality TEXT,
  ADD COLUMN IF NOT EXISTS vap_years_in_city INTEGER,
  ADD COLUMN IF NOT EXISTS vap_languages TEXT[],
  ADD COLUMN IF NOT EXISTS vap_interests TEXT[];

-- Update RLS policies to allow users to update their own VAP fields
-- (Existing policies on client_profiles should already cover this, 
-- but this is here for documentation)

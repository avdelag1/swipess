-- Add isolated Virtual Card (VAP) columns to client_profiles
ALTER TABLE client_profiles
ADD COLUMN IF NOT EXISTS vap_avatar text,
ADD COLUMN IF NOT EXISTS vap_bio text,
ADD COLUMN IF NOT EXISTS vap_occupation text,
ADD COLUMN IF NOT EXISTS vap_city text,
ADD COLUMN IF NOT EXISTS vap_nationality text,
ADD COLUMN IF NOT EXISTS vap_years_in_city integer,
ADD COLUMN IF NOT EXISTS vap_languages text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS vap_interests text[] DEFAULT '{}'::text[];

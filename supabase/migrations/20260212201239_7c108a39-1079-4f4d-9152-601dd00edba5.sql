
-- Add missing columns to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_title text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_type text DEFAULT 'property';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS cleanliness_rating integer;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS communication_rating integer;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS accuracy_rating integer;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS location_rating integer;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS value_rating integer;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS response_text text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS responded_at timestamp with time zone;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified_stay boolean DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS helpful_count integer DEFAULT 0;

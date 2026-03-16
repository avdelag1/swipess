ALTER TABLE public.roommate_preferences
ADD COLUMN IF NOT EXISTS preferred_age_min integer,
ADD COLUMN IF NOT EXISTS preferred_age_max integer,
ADD COLUMN IF NOT EXISTS preferred_cleanliness text,
ADD COLUMN IF NOT EXISTS preferred_noise_tolerance text,
ADD COLUMN IF NOT EXISTS preferred_smoking text,
ADD COLUMN IF NOT EXISTS preferred_drinking text,
ADD COLUMN IF NOT EXISTS preferred_work_schedule text;
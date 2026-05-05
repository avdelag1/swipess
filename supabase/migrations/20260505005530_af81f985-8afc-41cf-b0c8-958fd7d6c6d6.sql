ALTER TABLE public.events ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.client_profiles ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.owner_profiles ADD COLUMN IF NOT EXISTS video_url text;
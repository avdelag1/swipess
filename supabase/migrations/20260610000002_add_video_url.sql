ALTER TABLE public.client_profiles
ADD COLUMN IF NOT EXISTS video_url TEXT;

NOTIFY pgrst, 'reload schema';

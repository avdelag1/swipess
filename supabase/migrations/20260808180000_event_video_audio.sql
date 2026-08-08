-- Event video audio controls for Admin + Swipess app
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS video_audio_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS background_music_url text;

COMMENT ON COLUMN public.events.video_audio_enabled IS 'When true, consumers can unmute the event video audio track';
COMMENT ON COLUMN public.events.background_music_url IS 'Optional looping MP3/WAV/M4A bed played under the event video';

NOTIFY pgrst, 'reload schema';

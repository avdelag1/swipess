
-- 1. Add UPDATE policy on likes for upsert to work
CREATE POLICY "Users can update their own likes"
  ON public.likes FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Add missing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS radio_current_station_id text,
  ADD COLUMN IF NOT EXISTS swipe_sound_theme text DEFAULT 'default';

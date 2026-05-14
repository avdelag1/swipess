-- ============================================================
-- Add 'avatar' generated column to profiles
-- A live DB trigger reads profiles.avatar but the real column is
-- avatar_url. Adding a stored generated column so both names work.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar text GENERATED ALWAYS AS (avatar_url) STORED;

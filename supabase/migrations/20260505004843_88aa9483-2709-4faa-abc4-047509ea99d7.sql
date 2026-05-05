
ALTER TABLE public.likes
  ADD COLUMN IF NOT EXISTS dismissed_at timestamptz,
  ADD COLUMN IF NOT EXISTS dismiss_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cooldown_until timestamptz;

-- Backfill existing left-swipes as permanent dismissals (count=1, cooldown_until NULL)
UPDATE public.likes
SET dismiss_count = 1,
    dismissed_at = COALESCE(dismissed_at, created_at),
    cooldown_until = NULL
WHERE direction = 'left' AND dismiss_count = 0;

CREATE INDEX IF NOT EXISTS idx_likes_user_target_dir
  ON public.likes (user_id, target_type, direction);

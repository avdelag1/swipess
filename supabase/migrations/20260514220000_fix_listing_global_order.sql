-- Ensure get_smart_listings returns ALL active listings in a deterministic,
-- globally-consistent order so every account sees the same listings in the
-- same sequence — regardless of swipe history.
--
-- Previous versions filtered by swipe/like history (p_user_id was used in the
-- WHERE clause), which caused different accounts to see different properties.
-- This version intentionally ignores swipe history so the feed is identical
-- for every user.  The client-side swipe deck will still prevent re-showing
-- already-swiped cards via in-memory state.

CREATE OR REPLACE FUNCTION public.get_smart_listings(
  p_user_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_limit integer DEFAULT 30,
  p_offset integer DEFAULT 0
)
RETURNS SETOF public.listings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.*
  FROM public.listings l
  WHERE COALESCE(l.is_active, true) = true
    AND COALESCE(l.status, 'active') = 'active'
    AND (p_category IS NULL OR l.category = p_category)
    -- Always exclude own listings so owners don't see themselves
    AND (p_user_id IS NULL OR l.user_id IS DISTINCT FROM p_user_id)
    AND (p_user_id IS NULL OR l.owner_id IS DISTINCT FROM p_user_id)
  ORDER BY l.created_at ASC NULLS LAST, l.id ASC
  LIMIT  GREATEST(1, LEAST(COALESCE(p_limit, 30), 200))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

GRANT EXECUTE ON FUNCTION public.get_smart_listings(uuid, text, integer, integer)
  TO authenticated, anon;

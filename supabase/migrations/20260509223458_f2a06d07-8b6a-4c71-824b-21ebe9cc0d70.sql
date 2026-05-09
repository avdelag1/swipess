CREATE OR REPLACE FUNCTION public.get_smart_listings(
  p_user_id uuid,
  p_category text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS SETOF public.listings
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.*
  FROM public.listings l
  WHERE COALESCE(l.is_active, true) = true
    AND COALESCE(l.status, 'active') = 'active'
    AND (p_user_id IS NULL OR l.user_id IS DISTINCT FROM p_user_id)
    AND (p_category IS NULL OR l.category = p_category)
    AND NOT EXISTS (
      SELECT 1
      FROM public.likes lk
      WHERE lk.user_id = p_user_id
        AND lk.target_id = l.id
        AND lk.target_type = 'listing'
        AND lk.direction = 'right'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.profile_views pv
      WHERE pv.user_id = p_user_id
        AND pv.viewed_profile_id = l.id
        AND pv.view_type = 'listing'
        AND pv.action = 'pass:3'
    )
  ORDER BY
    CASE
      WHEN COALESCE(l.owner_id, l.user_id) IN (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid
      ) THEN 1
      ELSE 0
    END ASC,
    COALESCE(l.updated_at, l.created_at) DESC,
    l.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 100))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

GRANT EXECUTE ON FUNCTION public.get_smart_listings(uuid, text, integer, integer) TO authenticated, anon;

CREATE INDEX IF NOT EXISTS idx_listings_real_first_feed
  ON public.listings (category, status, is_active, updated_at DESC, created_at DESC);
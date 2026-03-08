-- 1. Add click_count column to content_shares
ALTER TABLE public.content_shares ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0;

-- 2. has_user_already_reported: checks if a user already reported a specific user or listing
CREATE OR REPLACE FUNCTION public.has_user_already_reported(
  p_reporter_id uuid,
  p_reported_user_id uuid DEFAULT NULL,
  p_reported_listing_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_reports
    WHERE reporter_id = p_reporter_id
      AND (
        (p_reported_user_id IS NOT NULL AND reported_user_id = p_reported_user_id)
        OR
        (p_reported_listing_id IS NOT NULL AND reported_listing_id = p_reported_listing_id)
      )
      AND status IN ('pending', 'reviewing')
  )
$$;

-- 3. increment_share_clicks: increments click_count on content_shares by share ID
CREATE OR REPLACE FUNCTION public.increment_share_clicks(p_share_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.content_shares
  SET click_count = click_count + 1
  WHERE id = p_share_id;
END;
$$;

-- 4. increment_review_helpful: increments helpful_count on reviews by review ID
CREATE OR REPLACE FUNCTION public.increment_review_helpful(p_review_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reviews
  SET helpful_count = COALESCE(helpful_count, 0) + 1
  WHERE id = p_review_id;
END;
$$;
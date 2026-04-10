
-- ==============================================================================
-- 🚀 SPEED OF LIGHT: Smart Matching RPC Functions
-- Handles high-performance filtering and exclusion natively in the database.
-- Bypasses URL length limits and reduces client-side processing.
-- ==============================================================================

-- 1. SMART LISTING MATCHING
-- Efficiently selects active listings that the user hasn't swiped/liked yet.
CREATE OR REPLACE FUNCTION get_smart_listings(
  p_user_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.listings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT l.*
  FROM public.listings l
  WHERE l.status = 'active'
    AND l.is_active = true
    AND (l.owner_id != p_user_id OR l.owner_id IS NULL)
    AND (p_category IS NULL OR p_category = 'all' OR l.category = p_category)
    AND l.id NOT IN (
      SELECT target_id 
      FROM public.likes 
      WHERE user_id = p_user_id 
        AND target_type = 'listing'
        -- 🚀 SPEED OF LIGHT: Only exclude if it's a Right swipe OR a recent Left swipe (< 3 days)
        AND (direction = 'right' OR created_at > (NOW() - INTERVAL '3 days'))
    )
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


-- 2. SMART CLIENT MATCHING (For Owners)
-- Efficiently selects user profiles that the owner hasn't swiped/liked yet.
CREATE OR REPLACE FUNCTION get_smart_clients(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  WHERE p.id != p_user_id
    AND p.id NOT IN (
      SELECT target_id 
      FROM public.likes 
      WHERE user_id = p_user_id 
        AND target_type = 'profile'
    )
  ORDER BY p.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 3. SMART EVENT MATCHING
-- Efficiently selects events that are upcoming and not yet liked (optional, but good for speed).
CREATE OR REPLACE FUNCTION get_smart_events(
  p_user_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 30
)
RETURNS SETOF public.events
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT e.*
  FROM public.events e
  WHERE (p_category IS NULL OR p_category = 'all' OR e.category = p_category)
  ORDER BY e.event_date ASC
  LIMIT p_limit;
END;
$$;

-- Grant permissions for authenticated users to execute these functions
GRANT EXECUTE ON FUNCTION get_smart_listings(UUID, TEXT, INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_smart_clients(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_smart_events(UUID, TEXT, INTEGER) TO authenticated, anon;

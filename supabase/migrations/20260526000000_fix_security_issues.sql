-- ============================================================
-- FIX: Security Issues Found in Audit 2026-05-26
-- ============================================================

-- 1. Revoke dangerous grants on ai_usage table
REVOKE ALL ON public.ai_usage FROM anon;
REVOKE ALL ON public.ai_usage FROM authenticated;
GRANT SELECT, INSERT ON public.ai_usage TO authenticated;

-- 2. Fix SECURITY DEFINER functions missing search_path
CREATE OR REPLACE FUNCTION public.handle_mutual_like()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_id UUID;
    v_listing_id UUID;
    v_match_exists BOOLEAN;
BEGIN
    IF NEW.direction != 'right' THEN
        RETURN NEW;
    END IF;

    IF NEW.target_type = 'listing' THEN
        v_listing_id := NEW.target_id;
        SELECT owner_id INTO v_owner_id FROM public.listings WHERE id = v_listing_id;
        IF v_owner_id IS NOT NULL THEN
            IF EXISTS (
                SELECT 1 FROM public.likes 
                WHERE user_id = v_owner_id 
                AND target_id = NEW.user_id 
                AND target_type = 'profile' 
                AND direction = 'right'
            ) THEN
                SELECT EXISTS (
                    SELECT 1 FROM public.matches 
                    WHERE client_id = NEW.user_id 
                    AND owner_id = v_owner_id
                ) INTO v_match_exists;
                IF NOT v_match_exists THEN
                    INSERT INTO public.matches (client_id, owner_id, listing_id, status)
                    VALUES (NEW.user_id, v_owner_id, v_listing_id, 'active');
                END IF;
            END IF;
        END IF;

    ELSIF NEW.target_type = 'profile' THEN
        v_owner_id := NEW.user_id;
        SELECT id INTO v_listing_id 
        FROM public.listings 
        WHERE owner_id = v_owner_id
        AND id IN (
            SELECT target_id FROM public.likes 
            WHERE user_id = NEW.target_id 
            AND target_type = 'listing' 
            AND direction = 'right'
        )
        LIMIT 1;
        IF v_listing_id IS NOT NULL THEN
            SELECT EXISTS (
                SELECT 1 FROM public.matches 
                WHERE client_id = NEW.target_id 
                AND owner_id = v_owner_id
            ) INTO v_match_exists;
            IF NOT v_match_exists THEN
                INSERT INTO public.matches (client_id, owner_id, listing_id, status)
                VALUES (NEW.target_id, v_owner_id, v_listing_id, 'active');
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Fix smart matching RPCs with search_path
CREATE OR REPLACE FUNCTION get_smart_listings(
  p_user_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.listings
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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
        AND (direction = 'right' OR created_at > (NOW() - INTERVAL '3 days'))
    )
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION get_smart_clients(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  WHERE p.id != p_user_id
    AND p.role = 'client'
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

CREATE OR REPLACE FUNCTION get_smart_events(
  p_user_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 30
)
RETURNS SETOF public.events
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

NOTIFY pgrst, 'reload schema';

-- Copy/paste into Supabase SQL Editor (same as migration 20260615150000_audit_security_and_data.sql)

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
  WHERE auth.uid() IS NOT NULL
    AND COALESCE(l.is_active, true) = true
    AND COALESCE(l.status, 'active') = 'active'
    AND (p_category IS NULL OR l.category = p_category)
    AND l.user_id IS DISTINCT FROM COALESCE(p_user_id, auth.uid())
    AND l.owner_id IS DISTINCT FROM COALESCE(p_user_id, auth.uid())
  ORDER BY l.created_at ASC NULLS LAST, l.id ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 30), 200))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

REVOKE EXECUTE ON FUNCTION public.get_smart_listings(uuid, text, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_smart_listings(uuid, text, integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_notification_for_user(
  p_user_id uuid,
  p_notification_type text,
  p_title text,
  p_message text,
  p_related_user_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_id IS DISTINCT FROM v_actor
     AND p_related_user_id IS DISTINCT FROM v_actor THEN
    RAISE EXCEPTION 'Unauthorized notification target';
  END IF;

  INSERT INTO public.notifications (
    user_id, notification_type, title, message, related_user_id, metadata, is_read
  )
  VALUES (
    p_user_id, p_notification_type, p_title, p_message, p_related_user_id, p_metadata, false
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification_for_user(uuid, text, text, text, uuid, jsonb)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('exists', false);
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('exists', true, 'id', v_user_id);
  END IF;

  RETURN jsonb_build_object(
    'exists', true,
    'id', v_user_id,
    'email', p_email
  );
END;
$$;

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

UPDATE public.listings
SET
  latitude = 20.2114,
  longitude = -87.4654,
  updated_at = now()
WHERE status = 'active'
  AND COALESCE(is_active, true) = true
  AND (latitude IS NULL OR longitude IS NULL)
  AND (
    city ILIKE '%tulum%'
    OR city ILIKE '%beleta%'
    OR title ILIKE '%tulum%'
    OR title ILIKE '%holistika%'
    OR title ILIKE '%tranquil oasis%'
  );

NOTIFY pgrst, 'reload schema';
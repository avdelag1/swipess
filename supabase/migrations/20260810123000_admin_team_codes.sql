-- Admin-managed team codes + test default BUSINESS123
-- Each partner_businesses row keeps a unique team_code for staff join.

ALTER TABLE public.partner_businesses
  ADD COLUMN IF NOT EXISTS team_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS partner_businesses_team_code_uidx
  ON public.partner_businesses (team_code)
  WHERE team_code IS NOT NULL;

-- Backfill any missing codes
DO $$
DECLARE
  r RECORD;
  v_code TEXT;
BEGIN
  FOR r IN SELECT id FROM public.partner_businesses WHERE team_code IS NULL LOOP
    LOOP
      v_code := upper(substr(md5(random()::text || clock_timestamp()::text || r.id::text), 1, 6));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.partner_businesses WHERE team_code = v_code);
    END LOOP;
    UPDATE public.partner_businesses SET team_code = v_code WHERE id = r.id;
  END LOOP;
END $$;

-- Test default: assign BUSINESS123 to the oldest active business if the code is free
DO $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.partner_businesses WHERE upper(team_code) = 'BUSINESS123'
  ) THEN
    SELECT id INTO v_id
    FROM public.partner_businesses
    WHERE is_active = true
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_id IS NOT NULL THEN
      UPDATE public.partner_businesses
      SET team_code = 'BUSINESS123', updated_at = now()
      WHERE id = v_id;
    END IF;
  END IF;
END $$;

-- Admin helper: set or regenerate a team code (unique)
CREATE OR REPLACE FUNCTION public.admin_set_business_team_code(
  p_business_id UUID,
  p_team_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_name TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  IF p_business_id IS NULL THEN
    RAISE EXCEPTION 'Business required';
  END IF;

  IF p_team_code IS NULL OR length(trim(p_team_code)) < 4 THEN
    LOOP
      v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.partner_businesses WHERE team_code = v_code);
    END LOOP;
  ELSE
    v_code := upper(regexp_replace(trim(p_team_code), '\s+', '', 'g'));
    IF EXISTS (
      SELECT 1 FROM public.partner_businesses
      WHERE upper(team_code) = v_code AND id <> p_business_id
    ) THEN
      RAISE EXCEPTION 'Team code % is already used by another business', v_code;
    END IF;
  END IF;

  UPDATE public.partner_businesses
  SET team_code = v_code, updated_at = now()
  WHERE id = p_business_id
  RETURNING name INTO v_name;

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  RETURN jsonb_build_object(
    'business_id', p_business_id,
    'name', v_name,
    'team_code', v_code
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_business_team_code(UUID, TEXT) TO authenticated;

-- Normalize join lookup (already upper/trim; keep in sync)
CREATE OR REPLACE FUNCTION public.join_partner_business(
  p_team_code TEXT,
  p_role TEXT DEFAULT 'staff'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_biz RECORD;
  v_existing UUID;
  v_email TEXT;
  v_name TEXT;
  v_role TEXT;
  v_code TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_code := upper(regexp_replace(trim(COALESCE(p_team_code, '')), '\s+', '', 'g'));
  IF length(v_code) < 4 THEN
    RAISE EXCEPTION 'Enter the team code from your manager or admin';
  END IF;

  v_role := lower(trim(COALESCE(p_role, 'staff')));
  IF v_role NOT IN ('staff', 'manager', 'owner') THEN
    v_role := 'staff';
  END IF;
  IF v_role = 'owner' THEN
    v_role := 'manager';
  END IF;

  SELECT id, name, team_code INTO v_biz
  FROM public.partner_businesses
  WHERE upper(regexp_replace(COALESCE(team_code, ''), '\s+', '', 'g')) = v_code
    AND is_active = true
  LIMIT 1;

  IF v_biz.id IS NULL THEN
    RAISE EXCEPTION 'Invalid team code. Ask admin/manager for the code.';
  END IF;

  SELECT bo.business_id INTO v_existing
  FROM public.business_owners bo
  WHERE bo.user_id = v_uid AND bo.is_active = true
  LIMIT 1;

  IF v_existing IS NOT NULL AND v_existing <> v_biz.id THEN
    RAISE EXCEPTION 'You already belong to another business';
  END IF;

  IF v_existing = v_biz.id THEN
    RETURN jsonb_build_object(
      'business_id', v_biz.id,
      'team_code', v_biz.team_code,
      'name', v_biz.name,
      'already_joined', true
    );
  END IF;

  SELECT u.email, COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, 'Staff'), '@', 1))
  INTO v_email, v_name
  FROM auth.users u
  WHERE u.id = v_uid;

  INSERT INTO public.business_owners (user_id, email, full_name, role, is_active, business_id, business_name)
  VALUES (v_uid, v_email, v_name, v_role, true, v_biz.id, v_biz.name)
  ON CONFLICT (user_id) DO UPDATE
    SET business_id = v_biz.id,
        business_name = v_biz.name,
        role = v_role,
        is_active = true,
        email = COALESCE(EXCLUDED.email, public.business_owners.email),
        full_name = COALESCE(EXCLUDED.full_name, public.business_owners.full_name),
        updated_at = now();

  RETURN jsonb_build_object(
    'business_id', v_biz.id,
    'team_code', v_biz.team_code,
    'name', v_biz.name,
    'role', v_role
  );
END;
$$;

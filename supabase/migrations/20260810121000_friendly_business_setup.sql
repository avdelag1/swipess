-- Friendly business setup: create or join without RLS chicken-and-egg.
-- Fix: insert+select on partner_businesses fails because SELECT requires
-- business_owners.business_id already pointing at the new row.

ALTER TABLE public.partner_businesses
  ADD COLUMN IF NOT EXISTS team_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS partner_businesses_team_code_uidx
  ON public.partner_businesses (team_code)
  WHERE team_code IS NOT NULL;

-- Backfill codes for existing businesses
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

CREATE OR REPLACE FUNCTION public._gen_business_team_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  LOOP
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.partner_businesses WHERE team_code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

-- Create a business and link the current user as owner (bypasses RLS safely).
CREATE OR REPLACE FUNCTION public.create_my_partner_business(
  p_name TEXT,
  p_business_type TEXT DEFAULT 'restaurant',
  p_address TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_existing UUID;
  v_biz_id UUID;
  v_code TEXT;
  v_email TEXT;
  v_name TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Enter a business name (at least 2 characters)';
  END IF;

  SELECT bo.business_id INTO v_existing
  FROM public.business_owners bo
  WHERE bo.user_id = v_uid AND bo.is_active = true
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'You already have access to a business. Refresh the page.';
  END IF;

  SELECT u.email, COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, 'Staff'), '@', 1))
  INTO v_email, v_name
  FROM auth.users u
  WHERE u.id = v_uid;

  INSERT INTO public.business_owners (user_id, email, full_name, role, is_active)
  VALUES (v_uid, v_email, v_name, 'owner', true)
  ON CONFLICT (user_id) DO UPDATE
    SET is_active = true,
        email = COALESCE(EXCLUDED.email, public.business_owners.email),
        full_name = COALESCE(EXCLUDED.full_name, public.business_owners.full_name),
        updated_at = now();

  v_code := public._gen_business_team_code();

  INSERT INTO public.partner_businesses (
    name, business_type, address, phone, email, team_code, is_active
  ) VALUES (
    trim(p_name),
    COALESCE(NULLIF(trim(p_business_type), ''), 'restaurant'),
    NULLIF(trim(COALESCE(p_address, '')), ''),
    NULLIF(trim(COALESCE(p_phone, '')), ''),
    NULLIF(trim(COALESCE(p_email, '')), ''),
    v_code,
    true
  )
  RETURNING id INTO v_biz_id;

  UPDATE public.business_owners
  SET business_id = v_biz_id,
      role = 'owner',
      business_name = trim(p_name),
      updated_at = now()
  WHERE user_id = v_uid;

  RETURN jsonb_build_object(
    'business_id', v_biz_id,
    'team_code', v_code,
    'name', trim(p_name)
  );
END;
$$;

-- Join an existing business with the short team code (for waiters / managers).
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
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_team_code IS NULL OR length(trim(p_team_code)) < 4 THEN
    RAISE EXCEPTION 'Enter the team code from your manager';
  END IF;

  v_role := lower(trim(COALESCE(p_role, 'staff')));
  IF v_role NOT IN ('staff', 'manager', 'owner') THEN
    v_role := 'staff';
  END IF;
  -- Joiners cannot self-assign owner
  IF v_role = 'owner' THEN
    v_role := 'manager';
  END IF;

  SELECT id, name, team_code INTO v_biz
  FROM public.partner_businesses
  WHERE upper(team_code) = upper(trim(p_team_code))
    AND is_active = true
  LIMIT 1;

  IF v_biz.id IS NULL THEN
    RAISE EXCEPTION 'Invalid team code. Ask your manager for the code in Settings.';
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

GRANT EXECUTE ON FUNCTION public.create_my_partner_business(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_partner_business(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public._gen_business_team_code() TO authenticated;

-- Allow authenticated business_owners to insert without circular SELECT issues
-- (RPC is preferred; this keeps Settings create resilient if RPC is missing).
DROP POLICY IF EXISTS "bo_insert_business" ON public.partner_businesses;
CREATE POLICY "bo_insert_business" ON public.partner_businesses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (
    public.is_business_owner(auth.uid()) OR public.is_admin_user(auth.uid())
  ));

-- Let staff read their business as soon as linked; also allow owners with matching id after link.
DROP POLICY IF EXISTS "bo_select_own_business" ON public.partner_businesses;
CREATE POLICY "bo_select_own_business" ON public.partner_businesses
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.business_owners bo
      WHERE bo.user_id = auth.uid()
        AND bo.is_active = true
        AND bo.business_id = partner_businesses.id
    )
  );

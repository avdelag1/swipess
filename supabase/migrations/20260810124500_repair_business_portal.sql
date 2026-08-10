-- Repair business portal ops: linking, scans, receipts, promos, test code

ALTER TABLE public.business_owners
  ADD COLUMN IF NOT EXISTS business_name TEXT;

ALTER TABLE public.partner_businesses
  ADD COLUMN IF NOT EXISTS team_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS partner_businesses_team_code_uidx
  ON public.partner_businesses (team_code)
  WHERE team_code IS NOT NULL;

-- Ensure every business has a team code
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

-- Test code BUSINESS123 on oldest active business if free
DO $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.partner_businesses WHERE upper(team_code) = 'BUSINESS123') THEN
    SELECT id INTO v_id
    FROM public.partner_businesses
    WHERE is_active = true
    ORDER BY created_at ASC
    LIMIT 1;
    IF v_id IS NOT NULL THEN
      UPDATE public.partner_businesses SET team_code = 'BUSINESS123', updated_at = now() WHERE id = v_id;
    END IF;
  END IF;
END $$;

-- Active business staff can update their transactions (receipts)
DROP POLICY IF EXISTS "bo_update_transactions" ON public.business_transactions;
CREATE POLICY "bo_update_transactions" ON public.business_transactions
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_owners bo
    WHERE bo.business_id = business_transactions.business_id
      AND bo.user_id = auth.uid()
      AND bo.is_active = true
  )
  OR public.is_admin_user(auth.uid())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_owners bo
    WHERE bo.business_id = business_transactions.business_id
      AND bo.user_id = auth.uid()
      AND bo.is_active = true
  )
  OR public.is_admin_user(auth.uid())
);

-- Active business staff can read client profiles (needed BEFORE first qr_scans insert)
DROP POLICY IF EXISTS "bo_select_scanned_client_profiles" ON public.client_profiles;
CREATE POLICY "bo_select_scanned_client_profiles" ON public.client_profiles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.business_owners bo
    WHERE bo.user_id = auth.uid()
      AND bo.is_active = true
      AND bo.business_id IS NOT NULL
  )
);

-- Also allow reading profiles table for QR lookup fallback
DROP POLICY IF EXISTS "bo_select_profiles_for_scans" ON public.profiles;
CREATE POLICY "bo_select_profiles_for_scans" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR user_id = auth.uid()
  OR public.is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.business_owners bo
    WHERE bo.user_id = auth.uid()
      AND bo.is_active = true
      AND bo.business_id IS NOT NULL
  )
);

-- Promo table (safe if already applied)
CREATE TABLE IF NOT EXISTS public.business_customer_promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.partner_businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Partner Promo',
  message TEXT,
  discount_percent NUMERIC NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, code)
);

CREATE INDEX IF NOT EXISTS idx_business_customer_promos_user
  ON public.business_customer_promos (user_id, status, created_at DESC);

ALTER TABLE public.business_customer_promos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bo_select_customer_promos" ON public.business_customer_promos;
CREATE POLICY "bo_select_customer_promos" ON public.business_customer_promos
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_owners bo
    WHERE bo.business_id = business_customer_promos.business_id
      AND bo.user_id = auth.uid()
      AND bo.is_active = true
  )
  OR user_id = auth.uid()
  OR public.is_admin_user(auth.uid())
);

DROP POLICY IF EXISTS "bo_insert_customer_promos" ON public.business_customer_promos;
CREATE POLICY "bo_insert_customer_promos" ON public.business_customer_promos
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_owners bo
    WHERE bo.business_id = business_customer_promos.business_id
      AND bo.user_id = auth.uid()
      AND bo.is_active = true
  )
  OR public.is_admin_user(auth.uid())
);

CREATE OR REPLACE FUNCTION public.send_business_customer_promo(
  p_user_id UUID,
  p_discount_percent NUMERIC,
  p_title TEXT DEFAULT 'Partner Promo',
  p_message TEXT DEFAULT NULL,
  p_expires_hours INTEGER DEFAULT 168
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
  v_business_name TEXT;
  v_code TEXT;
  v_promo_id UUID;
  v_expires TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT bo.business_id, pb.name
    INTO v_business_id, v_business_name
  FROM public.business_owners bo
  JOIN public.partner_businesses pb ON pb.id = bo.business_id
  WHERE bo.user_id = auth.uid()
    AND bo.is_active = true
  LIMIT 1;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Not a business owner — join with a team code first';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing customer';
  END IF;

  IF p_discount_percent IS NULL OR p_discount_percent < 1 OR p_discount_percent > 100 THEN
    RAISE EXCEPTION 'Discount must be between 1 and 100';
  END IF;

  v_code := 'SWP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_expires := now() + make_interval(hours => GREATEST(COALESCE(p_expires_hours, 168), 1));

  INSERT INTO public.business_customer_promos (
    business_id, user_id, code, title, message, discount_percent, status, expires_at, created_by
  ) VALUES (
    v_business_id,
    p_user_id,
    v_code,
    COALESCE(NULLIF(trim(p_title), ''), 'Partner Promo'),
    NULLIF(trim(p_message), ''),
    p_discount_percent,
    'active',
    v_expires,
    auth.uid()
  )
  RETURNING id INTO v_promo_id;

  BEGIN
    INSERT INTO public.notifications (
      user_id, title, message, notification_type, link_url, metadata, is_read
    ) VALUES (
      p_user_id,
      COALESCE(v_business_name, 'Partner') || ' sent you a promo',
      COALESCE(NULLIF(trim(p_message), ''), 'Show code ' || v_code || ' for ' || p_discount_percent::text || '% off on your next visit.'),
      'system_announcement',
      '/client/perks',
      jsonb_build_object(
        'kind', 'business_promo',
        'promo_id', v_promo_id,
        'code', v_code,
        'discount_percent', p_discount_percent,
        'business_id', v_business_id,
        'business_name', v_business_name
      ),
      false
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'promo_id', v_promo_id,
    'code', v_code,
    'expires_at', v_expires
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_business_customer_promo(UUID, NUMERIC, TEXT, TEXT, INTEGER) TO authenticated;

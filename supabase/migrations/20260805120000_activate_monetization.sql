-- ============================================================
-- Activate Monetization: God Mode, 5 Welcome Tokens, Restore Paid Messaging
-- ============================================================
-- This migration:
--   1. Restores user_has_unlimited_messaging() to check real subscriptions
--      (with a God Mode bypass for admin/test user IDs)
--   2. Updates rpc_grant_welcome_tokens() to grant 5 tokens instead of 1
-- ============================================================

-- 1. Restore user_has_unlimited_messaging with God Mode bypass
-- Previously overridden in 20260623120000_free_premium_for_everyone.sql to always return true.
-- Now restores the real subscription check, but adds a bypass for God Mode users.
CREATE OR REPLACE FUNCTION public.user_has_unlimited_messaging(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- God Mode users always have unlimited messaging
    p_user_id IN (
      'd229cb02-be77-44bc-9b5d-1a747e51b632'::uuid,
      'b840f348-7d85-4cf5-9e25-13d1d645b721'::uuid,
      '8b59c63c-ef72-45ee-a813-f5b9eabb874c'::uuid,
      'cf46e8d6-94af-4419-b987-eeaf9cab4829'::uuid,
      '2e50c534-9979-4885-b126-8a6c6384fc0d'::uuid,
      '5d37e29e-1979-4699-9dfb-7f6053bf6c5d'::uuid,
      'c7e35832-fe3e-4187-af1d-b34601581ed3'::uuid,
      '7fe73094-1868-4246-9564-6f2d0ad71e28'::uuid,
      '7e2b796b-70f9-4a3d-ac1f-7ce60def1205'::uuid
    )
    OR
    -- Real subscription check: user has an active, non-pay-per-use subscription
    EXISTS (
      SELECT 1
      FROM public.user_subscriptions us
      JOIN public.subscription_packages sp ON sp.id = us.package_id
      WHERE us.user_id = p_user_id
        AND us.is_active = true
        AND (us.end_date IS NULL OR us.end_date > now())
        AND sp.package_category NOT IN ('client_pay_per_use', 'owner_pay_per_use')
        AND COALESCE(sp.tier, '') <> 'pay_per_use'
    );
$$;

-- 2. Update rpc_grant_welcome_tokens to grant 5 tokens instead of 1
-- (and 6 if the user signed up via a referral link)
CREATE OR REPLACE FUNCTION public.rpc_grant_welcome_tokens(p_has_referral boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_amount  integer := 5;  -- 5 free welcome tokens (was 1)
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if welcome tokens were already granted
  IF EXISTS (
    SELECT 1 FROM public.tokens
    WHERE user_id = v_user_id AND activation_type = 'welcome'
  ) THEN
    RETURN; -- Already granted, do nothing
  END IF;

  -- Add extra token for referral signups
  IF p_has_referral THEN
    v_amount := v_amount + 1;
  END IF;

  INSERT INTO public.tokens (
    user_id,
    activation_type,
    total_activations,
    remaining_activations,
    used_activations,
    expires_at,
    notes,
    source,
    token_type
  ) VALUES (
    v_user_id,
    'welcome',
    v_amount,
    v_amount,
    0,
    now() + interval '90 days',
    'Welcome bonus: ' || v_amount || ' free message tokens',
    'system',
    'message'
  );
END;
$$;

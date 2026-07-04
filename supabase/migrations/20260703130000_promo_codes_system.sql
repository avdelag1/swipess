-- Migration to add Promo Code Redemption System

-- 1. Create a table to track used promo codes to prevent abuse
CREATE TABLE IF NOT EXISTS public.used_promo_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, code)
);

-- Enable RLS
ALTER TABLE public.used_promo_codes ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own used codes
CREATE POLICY "Users can view their own used codes"
  ON public.used_promo_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Create the RPC function to redeem promo codes
CREATE OR REPLACE FUNCTION public.rpc_redeem_promo_code(p_code text)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_code text := upper(trim(p_code));
  v_amount integer;
  v_package_name text;
  v_package_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::text;
    RETURN;
  END IF;

  IF v_code = '' THEN
    RETURN QUERY SELECT false, 'Invalid code'::text;
    RETURN;
  END IF;

  -- Check if already used
  IF EXISTS (SELECT 1 FROM public.used_promo_codes WHERE user_id = v_user_id AND code = v_code) THEN
    RETURN QUERY SELECT false, 'Code already used'::text;
    RETURN;
  END IF;

  -- Handle TOKENS{N}
  IF v_code LIKE 'TOKENS%' THEN
    -- Extract number from string
    BEGIN
      v_amount := CAST(substring(v_code FROM 7) AS integer);
    EXCEPTION WHEN invalid_text_representation THEN
      RETURN QUERY SELECT false, 'Invalid token code format'::text;
      RETURN;
    END;

    IF v_amount <= 0 THEN
      RETURN QUERY SELECT false, 'Invalid token amount'::text;
      RETURN;
    END IF;

    -- Grant tokens
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
      'promo_code',
      v_amount,
      v_amount,
      0,
      now() + interval '365 days',
      'Redeemed promo code: ' || v_code,
      'promo',
      'system'
    );

    -- Record usage
    INSERT INTO public.used_promo_codes (user_id, code) VALUES (v_user_id, v_code);

    RETURN QUERY SELECT true, 'Unlocked ' || v_amount::text || ' Tokens!'::text;
    RETURN;
  END IF;

  -- Handle PREMIUM{NAME}
  IF v_code LIKE 'PREMIUM%' THEN
    v_package_name := substring(v_code FROM 8);

    -- Find the premium package ID
    SELECT id INTO v_package_id 
    FROM public.premium_packages 
    WHERE upper(name) = v_package_name 
       OR upper(replace(name, ' ', '')) = v_package_name
    LIMIT 1;

    IF v_package_id IS NULL THEN
      RETURN QUERY SELECT false, 'Invalid premium package name'::text;
      RETURN;
    END IF;

    -- Grant premium subscription
    INSERT INTO public.owner_subscriptions (
      owner_id,
      package_id,
      status,
      started_at,
      expires_at
    ) VALUES (
      v_user_id,
      v_package_id,
      'active',
      now(),
      now() + interval '30 days' -- Give 30 days of premium for promo codes
    );

    -- Record usage
    INSERT INTO public.used_promo_codes (user_id, code) VALUES (v_user_id, v_code);

    RETURN QUERY SELECT true, 'Unlocked ' || v_package_name || ' Premium Package!'::text;
    RETURN;
  END IF;

  -- If it doesn't match known patterns
  RETURN QUERY SELECT false, 'Invalid promo code'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_redeem_promo_code(text) TO authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tokens' AND column_name = 'token'
  ) THEN
    EXECUTE 'ALTER TABLE public.tokens ALTER COLUMN token SET DEFAULT gen_random_uuid()::text';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_user_token_balance(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(COALESCE(t.remaining_activations, 0)), 0)::integer
  FROM public.tokens t
  WHERE t.user_id = p_user_id
    AND COALESCE(t.remaining_activations, 0) > 0
    AND (t.expires_at IS NULL OR t.expires_at > now());
$$;

CREATE OR REPLACE FUNCTION public.user_has_unlimited_messaging(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions us
    JOIN public.subscription_packages sp ON sp.id = us.package_id
    WHERE us.user_id = p_user_id
      AND us.is_active = true
      AND (us.expires_at IS NULL OR us.expires_at > now())
      AND sp.package_category NOT IN ('client_pay_per_use', 'owner_pay_per_use')
      AND COALESCE(sp.tier, '') <> 'pay_per_use'
  );
$$;

CREATE OR REPLACE FUNCTION public._deduct_user_tokens(
  p_user_id uuid,
  p_amount integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_needed integer := GREATEST(COALESCE(p_amount, 1), 1);
  v_row record;
  v_take integer;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  FOR v_row IN
    SELECT t.id, COALESCE(t.remaining_activations, 0) AS remaining_activations
    FROM public.tokens t
    WHERE t.user_id = p_user_id
      AND COALESCE(t.remaining_activations, 0) > 0
      AND (t.expires_at IS NULL OR t.expires_at > now())
    ORDER BY t.expires_at NULLS LAST, t.created_at ASC
    FOR UPDATE OF t
  LOOP
    EXIT WHEN v_needed <= 0;

    v_take := LEAST(v_row.remaining_activations, v_needed);

    UPDATE public.tokens
       SET remaining_activations = v_row.remaining_activations - v_take,
           used_activations = COALESCE(used_activations, 0) + v_take,
           updated_at = now()
     WHERE id = v_row.id;

    v_needed := v_needed - v_take;
  END LOOP;

  RETURN v_needed <= 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_deduct_token(
  p_amount integer DEFAULT 1,
  p_token_type text DEFAULT 'message'
)
RETURNS TABLE(success boolean, remaining_balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_ok boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM p_token_type;

  v_ok := public._deduct_user_tokens(v_user_id, COALESCE(p_amount, 1));

  RETURN QUERY
  SELECT v_ok, public.get_user_token_balance(v_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_deduct_token(integer, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_get_user_tokens()
RETURNS TABLE(user_id uuid, total_messages integer, total_credits integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_balance := public.get_user_token_balance(v_user_id);

  RETURN QUERY SELECT v_user_id, v_balance, v_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_user_tokens() TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_grant_welcome_tokens(
  p_has_referral boolean DEFAULT false
)
RETURNS TABLE(success boolean, tokens_granted integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_amount integer;
  v_expires_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.tokens t
    WHERE t.user_id = v_user_id
      AND t.activation_type = 'welcome'
  ) THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  v_amount := CASE WHEN COALESCE(p_has_referral, false) THEN 2 ELSE 1 END;
  v_expires_at := now() + interval '90 days';

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
    v_expires_at,
    CASE WHEN COALESCE(p_has_referral, false)
      THEN 'Welcome bonus - referral signup (2 free tokens)'
      ELSE 'Welcome bonus - first token free'
    END,
    'signup',
    'message'
  );

  RETURN QUERY SELECT true, v_amount;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_grant_welcome_tokens(boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_grant_referral_bonus(
  p_referrer_id uuid
)
RETURNS TABLE(success boolean, tokens_granted integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_user_id uuid := auth.uid();
  v_amount integer := 1;
  v_expires_at timestamptz;
  v_notes text;
BEGIN
  IF v_new_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_referrer_id IS NULL OR p_referrer_id = v_new_user_id THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = p_referrer_id
  ) THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  v_notes := format('Referral reward - referred_user:%s', v_new_user_id);

  IF EXISTS (
    SELECT 1 FROM public.tokens t
    WHERE t.user_id = p_referrer_id
      AND t.activation_type = 'referral_bonus'
      AND t.notes = v_notes
  ) THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  v_expires_at := now() + interval '60 days';

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
    p_referrer_id,
    'referral_bonus',
    v_amount,
    v_amount,
    0,
    v_expires_at,
    v_notes,
    'referral',
    'message'
  );

  RETURN QUERY SELECT true, v_amount;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_grant_referral_bonus(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.start_conversation_with_message(
  p_other_user_id  uuid,
  p_initial_message text,
  p_listing_id     uuid DEFAULT NULL
)
RETURNS TABLE(conversation_id uuid, message_id uuid, created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         uuid := auth.uid();
  v_my_role         text;
  v_other_role      text;
  v_client_id       uuid;
  v_owner_id        uuid;
  v_conversation_id uuid;
  v_message_id      uuid;
  v_created         boolean := false;
  v_msg             text := COALESCE(NULLIF(btrim(p_initial_message), ''), 'Hi!');
  v_deducted        boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_other_user_id IS NULL OR p_other_user_id = v_user_id THEN
    RAISE EXCEPTION 'Invalid recipient';
  END IF;

  SELECT role::text INTO v_my_role    FROM public.user_roles WHERE user_id = v_user_id       LIMIT 1;
  SELECT role::text INTO v_other_role FROM public.user_roles WHERE user_id = p_other_user_id LIMIT 1;

  v_my_role    := COALESCE(v_my_role,    'client');
  v_other_role := COALESCE(v_other_role, CASE WHEN v_my_role = 'client' THEN 'owner' ELSE 'client' END);

  IF v_my_role = 'owner' THEN
    v_owner_id  := v_user_id;
    v_client_id := p_other_user_id;
  ELSIF v_other_role = 'owner' THEN
    v_owner_id  := p_other_user_id;
    v_client_id := v_user_id;
  ELSE
    v_client_id := LEAST(v_user_id, p_other_user_id);
    v_owner_id  := GREATEST(v_user_id, p_other_user_id);
  END IF;

  SELECT id INTO v_conversation_id
    FROM public.conversations
   WHERE (client_id = v_user_id AND owner_id = p_other_user_id)
      OR (client_id = p_other_user_id AND owner_id = v_user_id)
   ORDER BY created_at ASC
   LIMIT 1;

  IF v_conversation_id IS NULL THEN
    IF NOT public.user_has_unlimited_messaging(v_user_id)
       AND public.get_user_token_balance(v_user_id) < 1 THEN
      RAISE EXCEPTION 'You need message tokens or a premium plan to start a new conversation.';
    END IF;

    INSERT INTO public.conversations (client_id, owner_id, listing_id, status)
    VALUES (v_client_id, v_owner_id, p_listing_id, 'active')
    RETURNING id INTO v_conversation_id;
    v_created := true;
  ELSIF p_listing_id IS NOT NULL THEN
    UPDATE public.conversations
       SET listing_id = p_listing_id
     WHERE id = v_conversation_id AND listing_id IS NULL;
  END IF;

  INSERT INTO public.conversation_messages (
    conversation_id, sender_id, message_text, message_type
  ) VALUES (
    v_conversation_id, v_user_id, v_msg, 'text'
  ) RETURNING id INTO v_message_id;

  IF v_created AND NOT public.user_has_unlimited_messaging(v_user_id) THEN
    v_deducted := public._deduct_user_tokens(v_user_id, 1);
    IF NOT v_deducted THEN
      RAISE EXCEPTION 'You need message tokens or a premium plan to start a new conversation.';
    END IF;
  END IF;

  RETURN QUERY SELECT v_conversation_id, v_message_id, v_created;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_conversation_with_message(uuid, text, uuid) TO authenticated;

ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own tokens" ON public.tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON public.tokens;
DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.tokens;
DROP POLICY IF EXISTS "Users can view own tokens" ON public.tokens;
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.tokens;

CREATE POLICY "Users can view their own tokens"
  ON public.tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
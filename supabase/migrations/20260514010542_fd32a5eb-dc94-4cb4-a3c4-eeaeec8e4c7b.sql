-- 1. Clean up duplicate triggers on conversation_messages
DROP TRIGGER IF EXISTS on_new_conversation_message ON public.conversation_messages;
DROP TRIGGER IF EXISTS update_conversation_on_new_message ON public.conversation_messages;
DROP TRIGGER IF EXISTS trg_conversation_messages_update_conv ON public.conversation_messages;
-- Keep only trg_conversation_messages_after_insert (handle_new_conversation_message)
-- which updates last_message_at AND creates the recipient notification.

-- 2. Backend RPC: start (or find) a conversation and post the first message atomically.
CREATE OR REPLACE FUNCTION public.start_conversation_with_message(
  p_other_user_id uuid,
  p_initial_message text,
  p_listing_id uuid DEFAULT NULL
)
RETURNS TABLE(conversation_id uuid, message_id uuid, created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_my_role text;
  v_other_role text;
  v_client_id uuid;
  v_owner_id uuid;
  v_conversation_id uuid;
  v_message_id uuid;
  v_created boolean := false;
  v_msg text := COALESCE(NULLIF(btrim(p_initial_message), ''), 'Hi!');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_other_user_id IS NULL OR p_other_user_id = v_user_id THEN
    RAISE EXCEPTION 'Invalid recipient';
  END IF;

  -- Resolve roles from the source of truth
  SELECT role::text INTO v_my_role FROM public.user_roles WHERE user_id = v_user_id LIMIT 1;
  SELECT role::text INTO v_other_role FROM public.user_roles WHERE user_id = p_other_user_id LIMIT 1;
  v_my_role := COALESCE(v_my_role, 'client');
  v_other_role := COALESCE(v_other_role, CASE WHEN v_my_role = 'client' THEN 'owner' ELSE 'client' END);

  IF v_my_role = 'owner' THEN
    v_owner_id := v_user_id;
    v_client_id := p_other_user_id;
  ELSIF v_other_role = 'owner' THEN
    v_owner_id := p_other_user_id;
    v_client_id := v_user_id;
  ELSE
    -- Both clients (e.g. roommate match): keep deterministic ordering
    v_client_id := LEAST(v_user_id, p_other_user_id);
    v_owner_id := GREATEST(v_user_id, p_other_user_id);
  END IF;

  -- Find existing 1:1 conversation between these users (ignore listing_id for matching
  -- so repeated entry points across the app reuse the same thread)
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE (
    (client_id = v_user_id AND owner_id = p_other_user_id)
    OR (client_id = p_other_user_id AND owner_id = v_user_id)
  )
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
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
    conversation_id, sender_id, content, message_text, message_type
  ) VALUES (
    v_conversation_id, v_user_id, v_msg, v_msg, 'text'
  ) RETURNING id INTO v_message_id;

  RETURN QUERY SELECT v_conversation_id, v_message_id, v_created;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_conversation_with_message(uuid, text, uuid) TO authenticated;

-- 3. Realtime guarantees (idempotent)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END$$;
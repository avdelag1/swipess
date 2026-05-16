-- ============================================================
-- Comprehensive messaging fix (v2 — live DB has no `content` column)
-- ============================================================

-- 1. Drop EVERY trigger on conversation_messages (clean slate)
DROP TRIGGER IF EXISTS on_new_conversation_message            ON public.conversation_messages;
DROP TRIGGER IF EXISTS update_conversation_on_new_message     ON public.conversation_messages;
DROP TRIGGER IF EXISTS trg_conversation_messages_update_conv  ON public.conversation_messages;
DROP TRIGGER IF EXISTS trg_conversation_messages_after_insert ON public.conversation_messages;

-- 2. Add content column if it doesn't exist (live DB never had it)
ALTER TABLE public.conversation_messages
  ADD COLUMN IF NOT EXISTS content text DEFAULT '';

-- 3. Define update_conversation_timestamp() stub (was called by a trigger
--    but never created — undefined function caused every INSERT to fail).
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.conversations
     SET last_message_at = NEW.created_at,
         updated_at      = now()
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- 4. Single canonical after-insert function
CREATE OR REPLACE FUNCTION public.handle_new_conversation_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client_id    uuid;
  v_owner_id     uuid;
  v_recipient_id uuid;
  v_sender_name  text;
  v_preview      text;
BEGIN
  UPDATE public.conversations
     SET last_message_at = NEW.created_at,
         updated_at      = now()
   WHERE id = NEW.conversation_id
  RETURNING client_id, owner_id INTO v_client_id, v_owner_id;

  IF v_client_id IS NULL OR v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_recipient_id := CASE
    WHEN NEW.sender_id = v_client_id THEN v_owner_id
    ELSE v_client_id
  END;

  IF v_recipient_id IS NULL OR v_recipient_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(full_name, ''), 'Someone')
    INTO v_sender_name
    FROM public.profiles
   WHERE user_id = NEW.sender_id
   LIMIT 1;

  v_preview := LEFT(COALESCE(NULLIF(NEW.message_text, ''), '…'), 120);

  INSERT INTO public.notifications (
    user_id, notification_type, title, message,
    related_user_id, metadata, is_read
  ) VALUES (
    v_recipient_id,
    'message',
    'New message',
    COALESCE(v_sender_name, 'Someone') || ': ' || v_preview,
    NEW.sender_id,
    jsonb_build_object(
      'type',            'message',
      'conversation_id', NEW.conversation_id,
      'message_id',      NEW.id,
      'sender_id',       NEW.sender_id
    ),
    false
  );

  RETURN NEW;
END;
$$;

-- 5. Single clean trigger
CREATE TRIGGER trg_conversation_messages_after_insert
  AFTER INSERT ON public.conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_conversation_message();

-- 6. start_conversation_with_message RPC (was 404 in production)
CREATE OR REPLACE FUNCTION public.start_conversation_with_message(
  p_other_user_id  uuid,
  p_initial_message text,
  p_listing_id     uuid DEFAULT NULL
)
RETURNS TABLE(conversation_id uuid, message_id uuid, created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  RETURN QUERY SELECT v_conversation_id, v_message_id, v_created;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_conversation_with_message(uuid, text, uuid) TO authenticated;

-- 7. Realtime guarantees (idempotent)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

-- ============================================================
-- Fix notification_type enum mismatch in handle_new_conversation_message
-- The live DB notifications.notification_type is an enum; the trigger
-- was inserting 'message' which is not a valid value. The correct
-- value (per useNotificationSystem.tsx notificationTypeMap) is 'new_message'.
-- ============================================================

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
    'new_message',
    'New message',
    COALESCE(v_sender_name, 'Someone') || ': ' || v_preview,
    NEW.sender_id,
    jsonb_build_object(
      'type',            'new_message',
      'conversation_id', NEW.conversation_id,
      'message_id',      NEW.id,
      'sender_id',       NEW.sender_id
    ),
    false
  );

  RETURN NEW;
END;
$$;

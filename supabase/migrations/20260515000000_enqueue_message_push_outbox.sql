-- ============================================================
-- Extend the conversation_messages insert trigger so it ALSO
-- enqueues a row in push_outbox for the message recipient.
--
-- Previously, push notifications were only fired from the
-- recipient's client (useNotifications.tsx) which means a fully
-- offline recipient never got a push. Writing to push_outbox at
-- the DB layer guarantees every recipient gets queued, and the
-- new process-push-outbox edge function flushes the queue.
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
  v_sender_avatar text;
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

  SELECT COALESCE(NULLIF(full_name, ''), 'Someone'), avatar_url
    INTO v_sender_name, v_sender_avatar
    FROM public.profiles
   WHERE user_id = NEW.sender_id
   LIMIT 1;

  v_preview := LEFT(COALESCE(NULLIF(NEW.message_text, ''), '…'), 120);

  -- 1. In-app notification (banner / bell)
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
      'sender_id',       NEW.sender_id,
      'sender_avatar',   v_sender_avatar
    ),
    false
  );

  -- 2. Push outbox (delivered to all of the recipient's devices)
  BEGIN
    INSERT INTO public.push_outbox (
      user_id,
      title,
      body,
      data,
      url,
      conversation_id,
      conversation_message_id,
      notification_type,
      related_user_id,
      status
    ) VALUES (
      v_recipient_id,
      'Message from ' || COALESCE(v_sender_name, 'Someone'),
      v_preview,
      jsonb_build_object(
        'type',            'message',
        'conversation_id', NEW.conversation_id,
        'message_id',      NEW.id,
        'sender_id',       NEW.sender_id
      ),
      '/messages?conversationId=' || NEW.conversation_id::text,
      NEW.conversation_id,
      NEW.id,
      'message',
      NEW.sender_id,
      'pending'
    );
  EXCEPTION WHEN OTHERS THEN
    -- never block the message insert just because the queue is unhappy
    RAISE WARNING 'push_outbox insert skipped: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

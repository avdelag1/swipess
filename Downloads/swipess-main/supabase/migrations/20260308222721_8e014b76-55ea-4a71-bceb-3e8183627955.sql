-- 1. Create SECURITY DEFINER function for cross-user notifications
CREATE OR REPLACE FUNCTION public.create_notification_for_user(
  p_user_id uuid,
  p_notification_type text,
  p_title text,
  p_message text,
  p_related_user_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, notification_type, title, message, related_user_id, metadata, is_read)
  VALUES (p_user_id, p_notification_type, p_title, p_message, p_related_user_id, p_metadata, false)
  RETURNING id INTO v_notification_id;
  RETURN v_notification_id;
END;
$$;

-- 2. Fix conversation_messages UPDATE RLS to allow marking messages as read
DROP POLICY IF EXISTS "Users can update their own messages" ON public.conversation_messages;
CREATE POLICY "Users can update messages in their conversations"
  ON public.conversation_messages FOR UPDATE
  USING (
    (sender_id = (SELECT auth.uid()))
    OR public.is_conversation_participant((SELECT auth.uid()), conversation_id)
  );

-- 3. Add SELECT policy on likes for listing owners to see who liked their listings
CREATE POLICY "Owners can see likes on their listings"
  ON public.likes FOR SELECT
  USING (
    target_id IN (SELECT id FROM public.listings WHERE owner_id = (SELECT auth.uid()))
    OR target_id = (SELECT auth.uid())
  );

-- 4. Add unique index on conversations to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS conversations_client_owner_unique 
  ON public.conversations (client_id, owner_id) 
  WHERE client_id IS NOT NULL AND owner_id IS NOT NULL;
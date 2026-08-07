-- Fix AI chat cloud history RLS (42501 on insert/upsert).
-- Client chat still works with localStorage; this restores optional cloud sync.

-- Drop legacy FOR ALL policies that only set USING (broken WITH CHECK on some PG versions)
DROP POLICY IF EXISTS "Users can manage their own AI conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can manage their own AI messages" ON public.ai_messages;

-- Conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.ai_conversations;

CREATE POLICY "ai_convos_select_own"
  ON public.ai_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ai_convos_insert_own"
  ON public.ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_convos_update_own"
  ON public.ai_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_convos_delete_own"
  ON public.ai_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages
DROP POLICY IF EXISTS "Users can view own messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can create own messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.ai_messages;

CREATE POLICY "ai_msgs_select_own"
  ON public.ai_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ai_msgs_insert_own"
  ON public.ai_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "ai_msgs_update_own"
  ON public.ai_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_msgs_delete_own"
  ON public.ai_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger that bumps conversation.updated_at must run as owner of the function
-- so RLS does not block the update from the messages insert path.
CREATE OR REPLACE FUNCTION public.update_ai_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ai_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

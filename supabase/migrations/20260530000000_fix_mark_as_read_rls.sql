-- ============================================================
-- Fix conversation_messages UPDATE RLS so participants can
-- mark messages (including other people's) as read.
-- The 20260308222721 migration had this fix but was never
-- applied to the live DB, while 20260514200000 only ensured
-- SELECT/INSERT policies exist — leaving the original
-- "Users can update their own messages" policy in place.
-- ============================================================

DROP POLICY IF EXISTS "Users can update their own messages" ON public.conversation_messages;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'conversation_messages'
       AND policyname = 'Users can update messages in their conversations'
  ) THEN
    CREATE POLICY "Users can update messages in their conversations"
      ON public.conversation_messages FOR UPDATE
      USING (
        public.is_conversation_participant(auth.uid(), conversation_id)
      );
  END IF;
END $$;

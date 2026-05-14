-- ============================================================
-- Fix is_conversation_participant + drop read_at dependency
-- Migration 20260213021741 was never applied to the live DB,
-- so this function (used by the RLS SELECT policy on
-- conversation_messages) doesn't exist — every SELECT fails
-- → messages appear to vanish on page refresh.
-- ============================================================

-- 1. Create / replace the participant check function
-- Must DROP first — live DB has the function with different param names (c_id)
-- and PostgreSQL won't let CREATE OR REPLACE change param names.
DROP FUNCTION IF EXISTS public.is_conversation_participant(uuid, uuid);

CREATE FUNCTION public.is_conversation_participant(
  _user_id        uuid,
  _conversation_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
     WHERE id = _conversation_id
       AND (client_id = _user_id OR owner_id = _user_id)
  );
$$;

-- 2. Ensure the RLS policies exist (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'conversation_messages'
       AND policyname = 'Users can view messages in their conversations'
  ) THEN
    CREATE POLICY "Users can view messages in their conversations"
      ON public.conversation_messages FOR SELECT
      USING (public.is_conversation_participant(auth.uid(), conversation_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'conversation_messages'
       AND policyname = 'Users can send messages in their conversations'
  ) THEN
    CREATE POLICY "Users can send messages in their conversations"
      ON public.conversation_messages FOR INSERT
      WITH CHECK (
        public.is_conversation_participant(auth.uid(), conversation_id)
        AND sender_id = auth.uid()
      );
  END IF;
END $$;

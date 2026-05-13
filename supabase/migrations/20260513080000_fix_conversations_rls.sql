-- Fix conversations and conversation_messages RLS policies.
-- Both SELECT and INSERT were returning 403 Forbidden due to missing or
-- conflicting policies created by earlier migrations running out of order.

-- ── conversations ─────────────────────────────────────────────────────────────

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Ensure required columns exist (safe no-ops if they're already there)
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS free_messaging boolean DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Drop ALL existing policies to start clean
DROP POLICY IF EXISTS "Users can create conversations"             ON public.conversations;
DROP POLICY IF EXISTS "Users can view own conversations"           ON public.conversations;
DROP POLICY IF EXISTS "Users can view their own conversations"     ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations"   ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations"         ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations for their matches" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_participant"           ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_participant"           ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_participant"           ON public.conversations;

-- Create clean, uniquely-named policies
CREATE POLICY "conversations_select_participant"
  ON public.conversations FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE POLICY "conversations_insert_participant"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE POLICY "conversations_update_participant"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = owner_id);

-- ── conversation_messages ────────────────────────────────────────────────────

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Ensure alias columns exist
ALTER TABLE public.conversation_messages ADD COLUMN IF NOT EXISTS message_text text;
ALTER TABLE public.conversation_messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in their conversations"  ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations"  ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can update their own messages"             ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_select_participant"                     ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_insert_participant"                     ON public.conversation_messages;
DROP POLICY IF EXISTS "messages_update_own"                             ON public.conversation_messages;

-- Create clean policies (avoid calling is_conversation_participant to reduce dependency)
CREATE POLICY "messages_select_participant"
  ON public.conversation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.client_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert_participant"
  ON public.conversation_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.client_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY "messages_update_own"
  ON public.conversation_messages FOR UPDATE
  USING (sender_id = auth.uid());

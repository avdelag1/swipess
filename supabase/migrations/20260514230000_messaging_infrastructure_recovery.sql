-- ============================================================
-- Recovery Migration for Messaging Infrastructure
-- Ensures all columns and RLS policies required for messaging are present
-- Handles idempotency to prevent errors on repeated application
-- ============================================================

-- 1. Fix is_conversation_participant function first (Foundation)
CREATE OR REPLACE FUNCTION public.is_conversation_participant(
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

-- 2. Hardening 'conversations' table columns
DO $$ 
BEGIN 
    -- client_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='client_id') THEN
        ALTER TABLE public.conversations ADD COLUMN client_id uuid REFERENCES auth.users(id);
    END IF;
    
    -- owner_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='owner_id') THEN
        ALTER TABLE public.conversations ADD COLUMN owner_id uuid REFERENCES auth.users(id);
    END IF;
    
    -- listing_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='listing_id') THEN
        ALTER TABLE public.conversations ADD COLUMN listing_id uuid REFERENCES public.listings(id);
    END IF;
    
    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='status') THEN
        ALTER TABLE public.conversations ADD COLUMN status text DEFAULT 'active';
    END IF;
    
    -- last_message_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='last_message_at') THEN
        ALTER TABLE public.conversations ADD COLUMN last_message_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 3. Hardening 'conversation_messages' table columns
DO $$ 
BEGIN 
    -- message_text (modern replacement for content)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversation_messages' AND column_name='message_text') THEN
        ALTER TABLE public.conversation_messages ADD COLUMN message_text text;
    END IF;
    
    -- is_read
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversation_messages' AND column_name='is_read') THEN
        ALTER TABLE public.conversation_messages ADD COLUMN is_read boolean DEFAULT false;
    END IF;
    
    -- read_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversation_messages' AND column_name='read_at') THEN
        ALTER TABLE public.conversation_messages ADD COLUMN read_at timestamptz;
    END IF;
END $$;

-- 4. Hardening 'listings' table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='listings' AND column_name='owner_id') THEN
        ALTER TABLE public.listings ADD COLUMN owner_id uuid REFERENCES auth.users(id);
    END IF;
END $$;

-- 5. Atomic RLS Recovery
-- We DROP first to ensure we replace any old restrictive versions
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "Participants can update message status" ON public.conversation_messages;

-- Conversations Access
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = owner_id);

-- Messages Access (SELECT)
CREATE POLICY "Users can view messages in their conversations"
  ON public.conversation_messages FOR SELECT
  USING (public.is_conversation_participant(auth.uid(), conversation_id));

-- Messages Access (INSERT)
CREATE POLICY "Users can send messages in their conversations"
  ON public.conversation_messages FOR INSERT
  WITH CHECK (
    public.is_conversation_participant(auth.uid(), conversation_id)
    AND sender_id = auth.uid()
  );

-- Messages Access (UPDATE) - Critical for Read Receipts
CREATE POLICY "Participants can update message status"
  ON public.conversation_messages FOR UPDATE
  USING (public.is_conversation_participant(auth.uid(), conversation_id));

-- 6. Backfill Data (Safety)
-- If client_id/owner_id were recently added, they might be null.
-- This is a best-effort backfill if we have match_id or similar.
-- (Skipped for now as we don't want to corrupt data without knowing the legacy structure perfectly)

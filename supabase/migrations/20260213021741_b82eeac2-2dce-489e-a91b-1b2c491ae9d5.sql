
-- Part 1: Add missing columns to conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS owner_id uuid,
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS free_messaging boolean DEFAULT false;

ALTER TABLE public.conversations
  ALTER COLUMN match_id DROP NOT NULL;

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_match_id_key;

-- Part 2: Add alias columns to conversation_messages
ALTER TABLE public.conversation_messages
  ADD COLUMN IF NOT EXISTS message_text text,
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

UPDATE public.conversation_messages SET message_text = content WHERE message_text IS NULL;
UPDATE public.conversation_messages SET is_read = (read_at IS NOT NULL) WHERE is_read IS NULL;

-- Part 3: Drop existing RLS policies on conversations that reference matches join
DROP POLICY IF EXISTS "Users can create conversations for their matches" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

-- Part 4: Add new RLS policies using client_id/owner_id columns
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE POLICY "Users can update their own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = owner_id);

-- Update is_conversation_participant function to use new columns
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
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

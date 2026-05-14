-- ============================================================
-- Add missing columns to conversation_messages
-- Migration 20260213021741 added these but was never applied
-- to the live DB. Using IF NOT EXISTS so it's safe to re-run.
-- ============================================================

ALTER TABLE public.conversation_messages
  ADD COLUMN IF NOT EXISTS message_text text,
  ADD COLUMN IF NOT EXISTS is_read      boolean NOT NULL DEFAULT false;

-- Back-fill message_text from content for any existing rows
UPDATE public.conversation_messages
   SET message_text = content
 WHERE message_text IS NULL AND content IS NOT NULL;

-- Back-fill is_read from read_at for any existing rows
UPDATE public.conversation_messages
   SET is_read = (read_at IS NOT NULL)
 WHERE is_read IS NULL OR is_read = false AND read_at IS NOT NULL;

-- Index to speed up the unread-count query
CREATE INDEX IF NOT EXISTS idx_conv_messages_unread
  ON public.conversation_messages (conversation_id, sender_id, is_read)
  WHERE is_read = false;

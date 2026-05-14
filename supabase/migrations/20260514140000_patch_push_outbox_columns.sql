-- ============================================================
-- Add missing columns to push_outbox
-- The live DB trigger inserts conversation_message_id (and likely
-- other message-related fields) that weren't in the initial schema.
-- ============================================================

ALTER TABLE public.push_outbox
  ADD COLUMN IF NOT EXISTS conversation_id         uuid,
  ADD COLUMN IF NOT EXISTS conversation_message_id uuid,
  ADD COLUMN IF NOT EXISTS notification_type       text  DEFAULT 'message',
  ADD COLUMN IF NOT EXISTS related_user_id         uuid;

-- Create function to update last_message_at on new messages
CREATE OR REPLACE FUNCTION public.update_conversation_last_message_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Add trigger on conversation_messages AFTER INSERT
CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON public.conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message_at();
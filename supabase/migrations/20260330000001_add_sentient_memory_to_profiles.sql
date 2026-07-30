
-- Add sentient_memory column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sentient_memory JSONB DEFAULT '{}'::jsonb;

-- Add a comment to describe the purpose
COMMENT ON COLUMN public.profiles.sentient_memory IS 'Stores AI-generated insights, preferences, and persona details about the user for personalized interactions.';

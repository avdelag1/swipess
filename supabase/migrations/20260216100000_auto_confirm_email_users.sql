-- ============================================================
-- AUTO-CONFIRM EMAIL USERS
-- ============================================================
-- This migration adds a trigger to automatically confirm email addresses
-- for users who sign up with email/password, so they can sign in immediately
-- without needing to click a confirmation link.
-- Google OAuth users are already auto-confirmed by Supabase.

-- Function to auto-confirm email on signup
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only auto-confirm email provider users (not OAuth)
  -- OAuth users (google, etc.) are already confirmed by the provider
  IF NEW.raw_app_meta_data->>'provider' = 'email' AND NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;

-- Create BEFORE INSERT trigger so confirmation is set during user creation
CREATE TRIGGER auto_confirm_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_email();

-- Also update any existing unconfirmed email users
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE raw_app_meta_data->>'provider' = 'email'
  AND email_confirmed_at IS NULL;

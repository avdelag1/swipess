-- ============================================================
-- ENSURE AUTH CONFIRMATION
-- ============================================================
-- This migration fixes the issue where email users are stuck as 
-- "unconfirmed" and cannot access the application.

-- 1. Force confirm all existing users
UPDATE auth.users
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. Re-install the auto-confirm trigger to be robust
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always set email_confirmed_at for new users
  -- This ensures they can sign in immediately
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  
  -- Ensure provider is set in app_metadata if it's an email signup
  -- (Sometimes Supabase metadata is slightly delayed on the first insert)
  IF NEW.raw_app_meta_data->>'provider' IS NULL AND NEW.email IS NOT NULL THEN
    NEW.raw_app_meta_data = jsonb_set(
      COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
      '{provider}',
      '"email"'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and recreate to ensure it's BEFORE INSERT
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;

CREATE TRIGGER auto_confirm_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_email();

-- 3. Ensure profiles are also onboarding_completed for these confirmed users
-- so they appear in the discovery deck immediately.
UPDATE public.profiles
SET onboarding_completed = true
WHERE email IN (
  SELECT email FROM auth.users WHERE email_confirmed_at IS NOT NULL
) AND onboarding_completed = false;

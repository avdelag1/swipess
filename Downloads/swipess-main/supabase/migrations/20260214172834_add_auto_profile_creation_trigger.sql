-- ============================================================
-- AUTO PROFILE CREATION TRIGGER
-- ============================================================
-- This migration adds a trigger to automatically create profile entries
-- when a new user signs up via Supabase Auth.
-- This prevents "Permission denied" errors during sign-in.

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table with user's metadata
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    onboarding_completed,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    false,  -- User needs to complete onboarding
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Ignore if profile already exists

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, authenticated;

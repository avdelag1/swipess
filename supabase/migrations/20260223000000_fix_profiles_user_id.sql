-- ============================================================
-- FIX PROFILES user_id COLUMN
-- ============================================================
-- Bug: The handle_new_user trigger and frontend profile creation code
-- both set profiles.id = auth_user_uuid but never set profiles.user_id.
-- Since most of the app queries profiles by user_id, this caused
-- widespread silent failures (conversations, matching, dashboard, etc.).
--
-- Fix:
-- 1. Update the trigger to also set user_id = NEW.id
-- 2. Backfill user_id = id for all existing profiles

-- Step 1: Replace the handle_new_user trigger function to include user_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    user_id,
    full_name,
    email,
    onboarding_completed,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id
  WHERE public.profiles.user_id IS NULL OR public.profiles.user_id != EXCLUDED.user_id;

  RETURN NEW;
END;
$$;

-- Step 2: Backfill user_id for all existing profiles
-- Since profiles.id = auth.users.id (set by the trigger), user_id should match
UPDATE public.profiles
SET user_id = id
WHERE user_id IS NULL OR user_id != id;

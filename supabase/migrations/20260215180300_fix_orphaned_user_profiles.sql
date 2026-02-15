-- ============================================================
-- FIX ORPHANED USER PROFILES
-- ============================================================
-- This migration identifies and cleans up orphaned user records
-- that exist in profiles/client_profiles/owner_profiles tables
-- but don't have corresponding auth.users entries.
--
-- Issue: Users appear in the app but not in Supabase Auth dashboard
-- Cause: Profile records created without valid auth.users entries
--
-- Solution: Delete orphaned records that can't be linked to auth users

-- Step 1: Log orphaned records before deletion (for audit trail)
DO $$
DECLARE
  orphaned_profiles_count INT;
  orphaned_client_profiles_count INT;
  orphaned_owner_profiles_count INT;
  orphaned_user_roles_count INT;
BEGIN
  -- Count orphaned profiles
  SELECT COUNT(*) INTO orphaned_profiles_count
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE au.id IS NULL;

  -- Count orphaned client_profiles
  SELECT COUNT(*) INTO orphaned_client_profiles_count
  FROM public.client_profiles cp
  LEFT JOIN auth.users au ON cp.user_id = au.id
  WHERE au.id IS NULL;

  -- Count orphaned owner_profiles
  SELECT COUNT(*) INTO orphaned_owner_profiles_count
  FROM public.owner_profiles op
  LEFT JOIN auth.users au ON op.user_id = au.id
  WHERE au.id IS NULL;

  -- Count orphaned user_roles
  SELECT COUNT(*) INTO orphaned_user_roles_count
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON ur.user_id = au.id
  WHERE au.id IS NULL;

  -- Log counts
  RAISE NOTICE 'Found % orphaned profiles', orphaned_profiles_count;
  RAISE NOTICE 'Found % orphaned client_profiles', orphaned_client_profiles_count;
  RAISE NOTICE 'Found % orphaned owner_profiles', orphaned_owner_profiles_count;
  RAISE NOTICE 'Found % orphaned user_roles', orphaned_user_roles_count;
END $$;

-- Step 2: Delete orphaned client_profiles
-- These are client profile entries without corresponding auth users
DELETE FROM public.client_profiles
WHERE user_id IN (
  SELECT cp.user_id
  FROM public.client_profiles cp
  LEFT JOIN auth.users au ON cp.user_id = au.id
  WHERE au.id IS NULL
);

-- Step 3: Delete orphaned owner_profiles
-- These are owner profile entries without corresponding auth users
DELETE FROM public.owner_profiles
WHERE user_id IN (
  SELECT op.user_id
  FROM public.owner_profiles op
  LEFT JOIN auth.users au ON op.user_id = au.id
  WHERE au.id IS NULL
);

-- Step 4: Delete orphaned user_roles
-- These are role assignments without corresponding auth users
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT ur.user_id
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON ur.user_id = au.id
  WHERE au.id IS NULL
);

-- Step 5: Delete orphaned profiles
-- These are base profile entries without corresponding auth users
-- IMPORTANT: This must be done AFTER deleting specialized profiles
-- because client_profiles and owner_profiles may reference profiles
DELETE FROM public.profiles
WHERE id IN (
  SELECT p.id
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE au.id IS NULL
);

-- Step 6: Verify all auth.users have profiles
-- Create missing profiles for auth users (should be handled by trigger, but just in case)
INSERT INTO public.profiles (
  id,
  full_name,
  email,
  onboarding_completed,
  created_at,
  updated_at
)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''),
  au.email,
  false,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 7: Add foreign key constraints to prevent future orphaned records
-- Note: We add these AFTER cleanup to ensure data integrity

-- Add FK from profiles to auth.users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK from client_profiles to auth.users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE public.client_profiles
      ADD CONSTRAINT client_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK from owner_profiles to auth.users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'owner_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE public.owner_profiles
      ADD CONSTRAINT owner_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK from user_roles to auth.users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Step 8: Final verification query
DO $$
DECLARE
  auth_users_count INT;
  profiles_count INT;
  client_profiles_count INT;
  owner_profiles_count INT;
  user_roles_count INT;
BEGIN
  SELECT COUNT(*) INTO auth_users_count FROM auth.users;
  SELECT COUNT(*) INTO profiles_count FROM public.profiles;
  SELECT COUNT(*) INTO client_profiles_count FROM public.client_profiles;
  SELECT COUNT(*) INTO owner_profiles_count FROM public.owner_profiles;
  SELECT COUNT(*) INTO user_roles_count FROM public.user_roles;

  RAISE NOTICE '=== MIGRATION COMPLETE ===';
  RAISE NOTICE 'Auth users: %', auth_users_count;
  RAISE NOTICE 'Profiles: %', profiles_count;
  RAISE NOTICE 'Client profiles: %', client_profiles_count;
  RAISE NOTICE 'Owner profiles: %', owner_profiles_count;
  RAISE NOTICE 'User roles: %', user_roles_count;

  -- All profiles should now have matching auth users
  IF profiles_count <= auth_users_count THEN
    RAISE NOTICE 'SUCCESS: All profiles have valid auth users';
  ELSE
    RAISE WARNING 'WARNING: Profile count exceeds auth user count';
  END IF;
END $$;

-- ============================================================
-- ADD RLS POLICIES FOR PROFILES TABLE
-- ============================================================
-- This migration adds Row Level Security policies for the profiles table
-- to allow users to view all profiles (needed for owner-side swipe functionality)

-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- CREATE POLICY: Allow all authenticated users to view all profiles
-- This is essential for the swipe functionality where owners need to see all user profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- CREATE POLICY: Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- CREATE POLICY: Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- CREATE POLICY: Allow users to delete their own profile (optional, for account deletion)
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

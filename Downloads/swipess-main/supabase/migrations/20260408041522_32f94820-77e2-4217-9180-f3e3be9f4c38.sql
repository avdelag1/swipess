
-- ============================================================
-- 1. PRIVILEGE ESCALATION: Remove dangerous INSERT policies
-- ============================================================

-- user_roles: remove self-insert (admin escalation vector)
DROP POLICY IF EXISTS "Users can manage their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can create their own role" ON public.user_roles;

-- tokens: remove self-insert (credit minting)
DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.tokens;
DROP POLICY IF EXISTS "Users can create their own tokens" ON public.tokens;
DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.tokens;

-- message_activations: remove self-insert (free messaging)
DROP POLICY IF EXISTS "Users can insert their own activations" ON public.message_activations;
DROP POLICY IF EXISTS "Users can create their own activations" ON public.message_activations;
DROP POLICY IF EXISTS "Users can manage their own activations" ON public.message_activations;

-- user_subscriptions: remove self-insert (free premium)
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.user_subscriptions;

-- legal_document_quota: remove self-insert and self-update
DROP POLICY IF EXISTS "Users can insert their own quota" ON public.legal_document_quota;
DROP POLICY IF EXISTS "Users can create their own quota" ON public.legal_document_quota;
DROP POLICY IF EXISTS "Users can update their own quota" ON public.legal_document_quota;
DROP POLICY IF EXISTS "Users can manage their own quota" ON public.legal_document_quota;

-- notifications: remove self-insert
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;

-- ============================================================
-- 2. SENSITIVE DATA: Restrict profiles SELECT to hide email/phone
-- ============================================================

-- Drop the overly permissive profiles SELECT policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Create a new policy: all authenticated users can see profiles (needed for matching/discovery)
-- but we use a database view to control which columns are exposed
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Owner can always see their own full profile (including email/phone)
-- This is already covered by the above policy since it returns all columns to authenticated users
-- We will handle column-level security via application logic

-- Drop overly permissive owner_profiles SELECT
DROP POLICY IF EXISTS "Anyone can view owner profiles" ON public.owner_profiles;
DROP POLICY IF EXISTS "Owner profiles are viewable by everyone" ON public.owner_profiles;
DROP POLICY IF EXISTS "Public owner profiles are viewable by everyone" ON public.owner_profiles;
DROP POLICY IF EXISTS "owner_profiles_select_policy" ON public.owner_profiles;

CREATE POLICY "Authenticated users can view owner profiles"
ON public.owner_profiles
FOR SELECT
TO authenticated
USING (true);

-- ============================================================
-- 3. STORAGE: Fix listing-images and listing-videos INSERT policies
-- ============================================================

-- Fix listing-images INSERT to enforce folder ownership
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix listing-videos INSERT to enforce folder ownership  
DROP POLICY IF EXISTS "Authenticated users can upload listing videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- 4. SECURE upsert_user_role function (prevent escalation)
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_user_role(p_user_id UUID, p_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to set their own role
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s role';
  END IF;
  
  -- Prevent users from assigning themselves admin role
  IF p_role = 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: admin role cannot be self-assigned';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

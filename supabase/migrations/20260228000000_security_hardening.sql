-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================
-- This migration addresses security warnings by:
-- 1. Ensuring all SECURITY DEFINER functions have a search_path set.
-- 2. Tightening RLS policies that were previously "Always True" (USING (true)).
-- 3. Restricting access to sensitive profiles to authenticated users only.

-- 1. FIX SECURITY DEFINER FUNCTIONS (Add search_path)
-- ------------------------------------------------------------

-- public.handle_new_user (Already fixed in some migrations, but let's be sure)
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- public.upsert_user_role
ALTER FUNCTION public.upsert_user_role(uuid, app_role) SET search_path = public;

-- public.check_email_exists
ALTER FUNCTION public.check_email_exists(text) SET search_path = public;

-- public.auto_confirm_email (from 20260216100000_auto_confirm_email_users.sql)
ALTER FUNCTION public.auto_confirm_email() SET search_path = public;

-- public.update_visual_preferences (from 20260214172011_add_user_visual_preferences.sql)
ALTER FUNCTION public.update_visual_preferences(jsonb) SET search_path = public;

-- public.fix_profile_id (from 20260223000000_fix_profiles_user_id.sql)
ALTER FUNCTION public.fix_profile_id() SET search_path = public;


-- 2. TIGHTEN RLS POLICIES (Authenticated Only)
-- ------------------------------------------------------------

-- PROFILES
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- CLIENT_PROFILES
DROP POLICY IF EXISTS "Users can view all client profiles" ON public.client_profiles;
CREATE POLICY "Authenticated users can view client profiles"
  ON public.client_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- OWNER_PROFILES
DROP POLICY IF EXISTS "Users can view all owner profiles" ON public.owner_profiles;
CREATE POLICY "Authenticated users can view owner profiles"
  ON public.owner_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- SUBSCRIPTION_PACKAGES
-- Keep this viewable by everyone as it's often needed for onboarding/landing pages
-- But if the user insists on "Always True" being a warning, we can restrict it.
-- For now, let's keep it public but move it to a safer policy name.
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.subscription_packages;
CREATE POLICY "Public can view subscription packages"
  ON public.subscription_packages FOR SELECT
  USING (true);

-- REVIEWS
DROP POLICY IF EXISTS "Users can view all reviews" ON public.reviews;
CREATE POLICY "Authenticated users can view reviews"
  ON public.reviews FOR SELECT
  USING (auth.role() = 'authenticated');

-- 3. ENABLE RLS ON ALL TABLES BY DEFAULT
-- ------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END;
$$;

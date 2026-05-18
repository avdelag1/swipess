-- ============================================================
-- ROBUST LISTINGS RLS POLICIES (2026-05-18)
-- ============================================================
-- Ensures owners can view, update, and delete their own listings
-- by checking both owner_id and user_id.

-- 1. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Owners can view their own listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can delete their own listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can create listings" ON public.listings;

-- 2. Re-create robust policies
CREATE POLICY "Owners can view their own listings"
  ON public.listings FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = user_id);

CREATE POLICY "Owners can create listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = user_id);

CREATE POLICY "Owners can update their own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = user_id);

CREATE POLICY "Owners can delete their own listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = user_id);

-- 3. Notify schema reload
NOTIFY pgrst, 'reload schema';

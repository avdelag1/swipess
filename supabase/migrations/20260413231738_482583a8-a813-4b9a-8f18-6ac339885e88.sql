
DROP POLICY IF EXISTS "Authenticated users can view owner profiles" ON public.owner_profiles;

CREATE POLICY "Authenticated users can view owner profiles"
ON public.owner_profiles
FOR SELECT
TO authenticated
USING (true);

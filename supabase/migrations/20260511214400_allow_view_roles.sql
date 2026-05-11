-- Migration: Allow viewing user roles for messaging participants
-- Created: 2026-05-11

-- Allow authenticated users to view user roles so they can identify participants
CREATE POLICY "Allow authenticated users to view roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (true);

COMMENT ON POLICY "Allow authenticated users to view roles" ON public.user_roles IS 'Required for messaging to resolve participant types (client vs owner).';

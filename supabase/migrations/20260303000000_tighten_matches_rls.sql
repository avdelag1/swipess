-- ============================================================
-- SECURITY: Tighten matches INSERT policy
-- Previously allowed any authenticated user to create matches
-- for any combination of users. Now restricts to participants only.
-- ============================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can create matches" ON public.matches;

-- Replace with a scoped policy: users can only create matches
-- where they are the client or owner
CREATE POLICY "Users can create their own matches"
    ON public.matches FOR INSERT
    WITH CHECK (auth.uid() = client_id OR auth.uid() = owner_id);

-- Add missing DELETE policy: users can only delete their own matches
DROP POLICY IF EXISTS "Users can delete own matches" ON public.matches;
CREATE POLICY "Users can delete own matches"
    ON public.matches FOR DELETE
    USING (auth.uid() = client_id OR auth.uid() = owner_id);

-- Add missing DELETE policy for conversations
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
CREATE POLICY "Users can delete own conversations"
    ON public.conversations FOR DELETE
    USING (auth.uid() = client_id OR auth.uid() = owner_id);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

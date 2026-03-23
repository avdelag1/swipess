-- ============================================================
-- SECURITY: Add RLS policies for the likes table
-- The likes table drives all swipe recording and match creation
-- but had no explicit RLS policies, relying only on implicit auth.
-- ============================================================

-- Enable RLS on likes (safe to run even if already enabled)
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only see their own swipes
DROP POLICY IF EXISTS "Users can view own likes" ON public.likes;
CREATE POLICY "Users can view own likes"
    ON public.likes FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: users can only record their own swipes
DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
CREATE POLICY "Users can insert own likes"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own swipes (direction changes on re-swipe)
DROP POLICY IF EXISTS "Users can update own likes" ON public.likes;
CREATE POLICY "Users can update own likes"
    ON public.likes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: users can only delete their own swipes
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;
CREATE POLICY "Users can delete own likes"
    ON public.likes FOR DELETE
    USING (auth.uid() = user_id);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

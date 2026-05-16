-- ============================================================
-- Make push_outbox.user_id nullable
-- The live DB trigger sometimes can't resolve a recipient user_id
-- and inserts NULL, which violates the NOT NULL constraint.
-- ============================================================

ALTER TABLE public.push_outbox
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN title   DROP NOT NULL,
  ALTER COLUMN body    DROP NOT NULL;

-- Tighten the RLS policy to still only show rows where user_id matches
DROP POLICY IF EXISTS "Users can read their own push_outbox entries" ON public.push_outbox;
CREATE POLICY "Users can read their own push_outbox entries"
  ON public.push_outbox FOR SELECT
  USING (auth.uid() = user_id);

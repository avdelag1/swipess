-- Fix: Replace overly permissive notifications INSERT policy
-- Old policy allowed any authenticated user to insert notifications for any user
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- New policy: Users can only create notifications where they are the related_user_id (sender)
-- This prevents arbitrary notification injection into other users' inboxes
CREATE POLICY "Authenticated users can insert notifications for interactions"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (
      -- Users can create notifications where they are the triggering user
      related_user_id = auth.uid()
      -- Or system notifications for themselves
      OR user_id = auth.uid()
    )
  );
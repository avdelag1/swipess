
-- Fix notifications INSERT RLS: remove dangerous related_user_id branch
DROP POLICY IF EXISTS "Authenticated users can insert notifications for interactions" ON public.notifications;

CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

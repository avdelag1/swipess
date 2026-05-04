
CREATE POLICY "Admins can view all reports"
  ON public.user_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
  ON public.user_reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reports"
  ON public.user_reports FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

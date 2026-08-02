-- Re-assert RLS policies for user_reports to fix schema drift

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reports" ON public.user_reports;
CREATE POLICY "Users can view own reports" ON public.user_reports
  FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can insert own reports" ON public.user_reports;
CREATE POLICY "Users can insert own reports" ON public.user_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);


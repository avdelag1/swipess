
CREATE TABLE public.content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  content_text TEXT NOT NULL,
  flag_reason TEXT NOT NULL,
  source_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

-- Users can insert their own flags
CREATE POLICY "Users can insert own flags"
  ON public.content_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own flags
CREATE POLICY "Users can view own flags"
  ON public.content_flags
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

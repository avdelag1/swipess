-- 1. Add missing columns to tokens table
ALTER TABLE public.tokens
ADD COLUMN IF NOT EXISTS activation_type text,
ADD COLUMN IF NOT EXISTS total_activations integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_activations integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS used_activations integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at timestamptz,
ADD COLUMN IF NOT EXISTS reset_date date,
ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_tokens_user_activation_type ON public.tokens (user_id, activation_type);

-- 2. Add views column to listings
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;

-- 3. Create legal_document_quota table
CREATE TABLE IF NOT EXISTS public.legal_document_quota (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  monthly_limit integer NOT NULL DEFAULT 0,
  used_this_month integer NOT NULL DEFAULT 0,
  reset_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_document_quota ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_legal_doc_quota_user ON public.legal_document_quota (user_id);

CREATE POLICY "Users can view own quota" ON public.legal_document_quota
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own quota" ON public.legal_document_quota
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own quota" ON public.legal_document_quota
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- 4. Create dispute_reports table
CREATE TABLE IF NOT EXISTS public.dispute_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.digital_contracts(id),
  reported_by uuid NOT NULL,
  reported_against uuid NOT NULL,
  issue_type text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dispute_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_dispute_reports_contract ON public.dispute_reports (contract_id);
CREATE INDEX IF NOT EXISTS idx_dispute_reports_reporter ON public.dispute_reports (reported_by);

CREATE POLICY "Users can view own disputes" ON public.dispute_reports
  FOR SELECT USING ((select auth.uid()) = reported_by OR (select auth.uid()) = reported_against);

CREATE POLICY "Users can insert own disputes" ON public.dispute_reports
  FOR INSERT WITH CHECK ((select auth.uid()) = reported_by);

-- 5. Create contracts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload contracts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'contracts' AND
    (select auth.uid())::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Users can view own contracts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'contracts' AND
    (select auth.uid())::text = (storage.foldername(name))[2]
  );
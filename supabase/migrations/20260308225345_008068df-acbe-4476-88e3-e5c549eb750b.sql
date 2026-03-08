
-- 1. Create legal_documents table
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  document_type text NOT NULL DEFAULT 'other',
  status text NOT NULL DEFAULT 'pending',
  verification_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_legal_documents_user ON public.legal_documents (user_id);

CREATE POLICY "Users can view own legal documents" ON public.legal_documents
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own legal documents" ON public.legal_documents
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own legal documents" ON public.legal_documents
  FOR DELETE USING ((select auth.uid()) = user_id);

-- 2. Create listing-videos storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-videos', 'listing-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload listing videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-videos');

CREATE POLICY "Anyone can view listing videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-videos');

CREATE POLICY "Users can delete own listing videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'listing-videos' AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- 3. Create legal-documents storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('legal-documents', 'legal-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own legal documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'legal-documents' AND (select auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own legal documents storage"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'legal-documents' AND (select auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own legal documents storage"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'legal-documents' AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- Migration to add legal document verification to listings
-- Adds columns for document URL and type
-- Run this in the Supabase SQL Editor

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS legal_document_url text,
ADD COLUMN IF NOT EXISTS legal_document_type text;

-- Add a comment for clarity
COMMENT ON COLUMN public.listings.legal_document_url IS 'URL to the uploaded legal verification document (PDF/DOC/DOCX)';
COMMENT ON COLUMN public.listings.legal_document_type IS 'Type of the legal document (e.g. title_deed, license)';

-- Enable storage for legal documents (Note: Bucket creation is usually done via UI/API, but policy is SQL)
-- Create bucket 'legal-documents' if it doesn't exist (using storage extension)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('legal-documents', 'legal-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for legal-documents bucket
CREATE POLICY "Legal documents are publicly accessible" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'legal-documents' );

CREATE POLICY "Authenticated users can upload legal documents" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
  bucket_id = 'legal-documents' 
  AND auth.role() = 'authenticated' 
);

CREATE POLICY "Users can update their own legal documents" 
ON storage.objects FOR UPDATE 
USING ( 
  bucket_id = 'legal-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1] 
);

CREATE POLICY "Users can delete their own legal documents" 
ON storage.objects FOR DELETE 
USING ( 
  bucket_id = 'legal-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1] 
);

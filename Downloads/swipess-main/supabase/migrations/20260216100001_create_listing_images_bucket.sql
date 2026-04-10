-- ============================================================
-- CREATE LISTING-IMAGES STORAGE BUCKET
-- ============================================================
-- The listing-images bucket is used by UnifiedListingForm,
-- ConversationalListingCreator, and AIListingAssistant to store
-- photos for property, motorcycle, bicycle, and worker listings.

-- Create listing-images storage bucket (public read access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload listing images to their own folder
CREATE POLICY "Users can upload own listing images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to listing images
CREATE POLICY "Listing images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

-- Allow users to update their own listing images
CREATE POLICY "Users can update own listing images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listing-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own listing images
CREATE POLICY "Users can delete own listing images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

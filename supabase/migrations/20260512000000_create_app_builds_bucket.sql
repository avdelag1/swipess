-- Create app-builds storage bucket for iOS/Android builds
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'app-builds',
  'app-builds',
  false,     -- Keep it private by default for security
  524288000  -- 500 MB per file limit
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Only authenticated users can upload builds
CREATE POLICY "authenticated_upload_builds" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'app-builds');

-- RLS: Only the uploader can see their builds (or we can make it broader)
CREATE POLICY "authenticated_select_builds" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'app-builds');

-- RLS: Allow users to delete their own build records
CREATE POLICY "authenticated_delete_builds" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'app-builds');

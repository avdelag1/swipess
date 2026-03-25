-- Create admin-uploads storage bucket (public so image URLs work without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-uploads',
  'admin-uploads',
  true,
  52428800,  -- 50 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: allow admins (JWT claim is_admin=true OR has_role('admin')) to upload
CREATE POLICY "admin_uploads_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'admin-uploads'
    AND (
      (auth.jwt() ->> 'is_admin') = 'true'
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- RLS: anyone can read (bucket is public)
CREATE POLICY "admin_uploads_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'admin-uploads');

-- RLS: admins can delete their uploads
CREATE POLICY "admin_uploads_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'admin-uploads'
    AND (
      (auth.jwt() ->> 'is_admin') = 'true'
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

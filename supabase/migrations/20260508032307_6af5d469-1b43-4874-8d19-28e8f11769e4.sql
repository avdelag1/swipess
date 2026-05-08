-- Create public storage bucket for admin-managed category card photos
insert into storage.buckets (id, name, public) values ('admin-uploads', 'admin-uploads', true)
on conflict (id) do nothing;

-- Public read
create policy "Admin uploads are publicly readable"
on storage.objects for select
using (bucket_id = 'admin-uploads');

-- Admins can upload
create policy "Admins can upload to admin-uploads"
on storage.objects for insert
to authenticated
with check (bucket_id = 'admin-uploads' and public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can update
create policy "Admins can update admin-uploads"
on storage.objects for update
to authenticated
using (bucket_id = 'admin-uploads' and public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can delete
create policy "Admins can delete admin-uploads"
on storage.objects for delete
to authenticated
using (bucket_id = 'admin-uploads' and public.has_role(auth.uid(), 'admin'::public.app_role));
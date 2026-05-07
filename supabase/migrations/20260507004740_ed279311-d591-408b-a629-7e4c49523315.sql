update storage.buckets set file_size_limit = 52428800, allowed_mime_types = null
 where id in ('listing-images','profile-images','event-images');
update storage.buckets set file_size_limit = 524288000, allowed_mime_types = null
 where id = 'listing-videos';
update storage.buckets set file_size_limit = 26214400, allowed_mime_types = null
 where id in ('contracts','legal-documents');
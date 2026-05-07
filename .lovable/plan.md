## Problem

Uploads currently reject many real-world photos:

- **`src/utils/fileValidation.ts`** rejects anything not strictly `image/jpeg | png | webp | gif`. iPhone HEIC/HEIF photos (very common) are rejected outright.
- Same file rejects raw files > **10 MB** *before* compression even runs. Modern phone photos are routinely 8–25 MB.
- Validation is called *before* `compressImage()` in `ImageUpload.tsx`, `PhotoUploadManager.tsx`, and `UnifiedListingForm.tsx`, so big photos never get a chance to be shrunk.
- Supabase storage buckets have `file_size_limit = NULL` (unlimited) which is fine, but we should pin sane caps so future tightening doesn't silently break uploads.

## Fix

### 1. `src/utils/fileValidation.ts`
- Add `image/heic`, `image/heif` to `ALLOWED_MIME_TYPES.IMAGES` and `.heic`, `.heif` to `ALLOWED_EXTENSIONS.IMAGES`.
- Accept files where `file.type` is empty or `application/octet-stream` if the **extension** is valid (older Android/iOS browsers send blank MIME).
- Raise `IMAGE_MAX_SIZE` from 10 MB → **50 MB** (raw pre-compression cap; client compression brings it under 1.5 MB).
- Keep document limit at 20 MB.
- Improve error copy: tell users what's actually wrong and that we'll auto-shrink.

### 2. `src/utils/imageCompression.ts`
- Detect HEIC/HEIF and lazy-import `heic2any` to convert to JPEG **before** running `browser-image-compression` (canvas can't decode HEIC directly).
- Wrap in try/catch — if conversion fails on a desktop build, still upload the original blob (storage accepts it; backend serves raw).
- Add `image/heic`/`heif` to the early-skip allowlist so they always get processed (not bypassed by the <200 KB shortcut).
- Add `bun add heic2any` (small, ~50 KB gz, dynamic-imported so no bundle hit until needed).

### 3. Call sites — validate after compression
Update the three uploaders so the order is **compress → validate compressed size**, with a soft raw-cap of 50 MB just to reject obvious garbage:
- `src/components/ImageUpload.tsx`
- `src/components/PhotoUploadManager.tsx`
- `src/components/UnifiedListingForm.tsx`

This means an iPhone 24 MB HEIC becomes a ~900 KB WebP/JPEG and uploads cleanly.

### 4. Storage buckets (migration)
Set explicit, generous limits on `storage.buckets` so the server matches the client:

```sql
update storage.buckets set file_size_limit = 52428800,  -- 50 MB
  allowed_mime_types = null
 where id in ('listing-images','profile-images','event-images');

update storage.buckets set file_size_limit = 524288000  -- 500 MB
 where id = 'listing-videos';

update storage.buckets set file_size_limit = 26214400   -- 25 MB
 where id in ('contracts','legal-documents');
```

`allowed_mime_types = null` keeps the bucket accepting any image MIME (HEIC included) since the client now normalizes to JPEG/WebP before upload anyway.

### 5. Camera flows (sanity check, no code change expected)
`OwnerListingCamera.tsx` and `usePhotoCamera.tsx` already capture as JPEG via `<canvas>`, so they bypass HEIC entirely. No change needed.

## Outcome

- iPhone HEIC photos: accepted, auto-converted, uploaded.
- Large 20–50 MB DSLR/phone shots: accepted, auto-compressed to ~1 MB, uploaded.
- Blank-MIME edge cases: accepted via extension check.
- Server bucket limits explicitly set so behavior is consistent on every device.

No layout, theme, or business-logic changes — purely upload pipeline hardening.
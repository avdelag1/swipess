

# Full App Audit: Remaining Issues

After thorough review of every `(supabase as any)` call, storage bucket reference, and table query across 118 files, here's what's left.

## Issues Found

### 1. `profiles_public` Ghost Table (PublicProfilePreview.tsx)
`PublicProfilePreview.tsx` queries a `profiles_public` table that does not exist. The code has a fallback to `profiles`, but the initial query always fails silently, adding latency to every public profile view.

**Fix**: Remove the `profiles_public` query entirely. Query `profiles` directly (which already has a public SELECT policy).

### 2. `legal_documents` Ghost Table (LegalDocumentsDialog.tsx)
The Legal Documents feature queries, inserts into, and deletes from a `legal_documents` table that does not exist. The entire document upload/management flow silently fails.

**Fix**: Create `legal_documents` table with columns: `id, user_id, file_name, file_path, file_size, mime_type, document_type, status, created_at, updated_at`. Add RLS policies.

### 3. `listing-videos` Ghost Storage Bucket (videoUpload.ts)
Video uploads target a `listing-videos` bucket that doesn't exist. All video uploads fail silently.

**Fix**: Create `listing-videos` storage bucket (public: true, like `listing-images`), with upload policy for authenticated users.

### 4. `legal-documents` Ghost Storage Bucket (LegalDocumentsDialog.tsx)
Legal document uploads target a `legal-documents` bucket that doesn't exist.

**Fix**: Create `legal-documents` storage bucket (public: false, private documents), with RLS policy restricting access to own files.

## Summary

| Issue | Type | Impact |
|-------|------|--------|
| `profiles_public` | Ghost table | Adds latency to profile views |
| `legal_documents` | Ghost table | Legal documents feature broken |
| `listing-videos` | Ghost bucket | Video uploads broken |
| `legal-documents` | Ghost bucket | Document uploads broken |

## Implementation

1. **Database migration**: Create `legal_documents` table with RLS
2. **Storage migration**: Create `listing-videos` (public) and `legal-documents` (private) buckets with policies
3. **Code fix**: Update `PublicProfilePreview.tsx` to skip the `profiles_public` query and go straight to `profiles`

Everything else checks out. All previously fixed tables (`tokens`, `user_blocks`, `user_reports`, `saved_searches`, `push_subscriptions`, `user_security_settings`, `contract_signatures`, `deal_status_tracking`, `dispute_reports`, `legal_document_quota`, `user_radio_playlists`) are confirmed working with correct column alignment.


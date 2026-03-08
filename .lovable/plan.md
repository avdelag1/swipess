

# Deep Audit Round 3: 3 Remaining Issues

## Issue 1: `ListingPreviewDialog.tsx` — Ghost `view_count` Fallback

**File**: `src/components/ListingPreviewDialog.tsx` line 371
**Bug**: `listing.views || listing.view_count || 0` — `view_count` doesn't exist on the listings table. The column is `views`.
**Impact**: Minor — `listing.views` catches it first via `||`, but `view_count` is dead code that will cause TypeScript warnings and confuse future developers.
**Fix**: Change to `listing.views || 0` — remove the ghost fallback.

## Issue 2: `config.toml` Missing Two Edge Functions

**File**: `supabase/config.toml`
**Bug**: `moderate-image` and `send-push-notification` edge functions exist in `supabase/functions/` and are invoked from frontend code, but are NOT declared in `config.toml`. Without entries, they won't be deployed.
**Impact**: Image moderation silently fails (defaults to "safe"). Push notifications to other devices never send.
**Fix**: Add both to config.toml:
```toml
[functions.moderate-image]
verify_jwt = true

[functions.send-push-notification]
verify_jwt = true
```

## Issue 3: `delete-user` Edge Function Missing 10 Tables

**File**: `supabase/functions/delete-user/index.ts`
**Bug**: The deletion cascade skips these tables that contain user data:
- `swipes` (user_id)
- `reviews` (reviewer_id)
- `profile_views` (user_id, viewed_profile_id)
- `content_shares` (sharer_id)
- `content_flags` (user_id)
- `user_reports` (reporter_id)
- `user_blocks` (blocker_id)
- `digital_contracts` + `contract_signatures` + `deal_status_tracking` (owner_id/client_id)
- `support_tickets` (user_id)
- `saved_searches` (user_id)
- `legal_documents` + `legal_document_quota` (user_id)
- `message_activations` (user_id)
- `owner_client_preferences` (user_id)
- `user_radio_playlists` (user_id)

**Impact**: Account deletion leaves orphaned data in 15+ tables. GDPR non-compliance risk.
**Fix**: Add deletion steps for all missing tables before the existing Step 8 (specialized profiles).

## Summary

| Issue | Type | Impact |
|-------|------|--------|
| `view_count` ghost fallback | Dead code | Minor — cosmetic |
| Missing config.toml entries | Edge functions not deployed | Image moderation + push notifications broken |
| delete-user incomplete | Missing 15 tables | Orphaned data after account deletion |

## Implementation

### 1. Code Fix
- `ListingPreviewDialog.tsx` line 371: remove `listing.view_count ||`

### 2. Config Fix
- Add `moderate-image` and `send-push-notification` to `supabase/config.toml`

### 3. Edge Function Update
- Expand `delete-user/index.ts` with cleanup for all 15 missing tables, inserted before existing Step 8, respecting FK ordering


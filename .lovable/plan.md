

# Continued Audit: 3 More Issues Found

## Issue 1: `content_shares` Ghost Table (useSharing.ts)

`useSharing.ts` line 56 inserts into `content_shares` — table does not exist. The hook throws on error (line 69: `if (error) throw error`), which means every share attempt crashes the sharing flow instead of just silently failing.

**Fix**: Create `content_shares` table with columns: `id, sharer_id, shared_listing_id, shared_profile_id, share_method, recipient_email, recipient_phone, share_url, created_at`. RLS: users can insert/view own shares.

## Issue 2: `profile_views` Ghost Table (useProfileRecycling.ts)

`useProfileRecycling.ts` queries `profile_views` in 5 separate places (lines 33, 68, 136, 175, 207). This table tracks which profiles/listings a user has swiped on, enabling the recycling system that prevents showing already-seen content. Without it, all swipe history tracking silently fails.

**Fix**: Create `profile_views` table with columns: `id, user_id, viewed_profile_id, view_type, action, created_at`. Unique constraint on `(user_id, viewed_profile_id, view_type)`. RLS: users can CRUD own views.

## Issue 3: `ClientWorkerDiscovery.tsx` Wrong Profile Join Column

Line 78-81: queries `profiles` with `.in('id', ownerIds)` and maps by `p.id`, but `ownerIds` contains user UUIDs from `listings.owner_id`. The profiles table uses `user_id` for the user UUID, not `id`. Result: worker listing owner profiles never match — all worker cards show no owner info.

**Fix**: Change `.in('id', ownerIds)` to `.in('user_id', ownerIds)`, select `user_id` in the query, and map by `p.user_id` instead of `p.id`.

## Implementation

### 1. DB Migration
- Create `content_shares` table with RLS
- Create `profile_views` table with unique constraint and RLS

### 2. Code Fix — ClientWorkerDiscovery.tsx
- Line 78: `.in('id', ownerIds)` → `.in('user_id', ownerIds)`
- Line 78: add `user_id` to select
- Line 81: `p.id` → `p.user_id`


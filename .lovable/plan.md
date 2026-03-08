

# Continued Audit: More Critical Bugs

## Bug 1: `matches` Table Schema Mismatch (CRITICAL — Silent Failures)

The `matches` table has columns: `id, listing_id, user_id, owner_id, created_at`. That's it.

But multiple files use **non-existent columns** via `(supabase as any)` to bypass TypeScript:

- **`useLikeNotificationActions.tsx`** lines 42-74: queries/inserts using `client_id` (should be `user_id`), `status`, `updated_at` — all non-existent. The "accept like" flow silently fails to create matches.
- **`useDirectMessageListing.ts`** lines 91-98: inserts using `client_id` and `status` — silently fails.
- **`useMessagingQuota.tsx`** lines 96-108: counts conversations via `match_id` which is usually null — always returns 0 conversations started, so quota enforcement is broken.

**Fix**: Replace all `client_id` references with `user_id` in matches queries. Remove `status`/`updated_at` fields from inserts/updates (they don't exist). Fix `useMessagingQuota` to count conversations directly via `client_id`/`owner_id` instead of going through matches.

## Bug 2: `notifications.read_at` Column Doesn't Exist

The `notifications` table has no `read_at` column. `useLikeNotificationActions.tsx` lines 105 and 143 set `read_at` on updates — this field is silently ignored. Not a blocker since `is_read: true` still works, but it's dead code that should be cleaned up.

**Fix**: Remove `read_at` from notification updates.

## Bug 3: `NotificationSystem.tsx` Still Requests Permission on Startup

Line 16-28: `NotificationSystem` requests `Notification.requestPermission()` on mount. The comment in `useNotifications.tsx` says "Do NOT request notification permission on startup." But `NotificationSystem` is not mounted anywhere currently (it was removed from DashboardLayout per line 603 comment). However, the component still exists and could be re-imported. Low priority — just cleanup.

## Bug 4: `useMessagingQuota` Broken Conversation Counting

Lines 96-108 count conversations by finding matches first, then filtering conversations by `match_id`. Since most conversations have `match_id = null`, this always returns 0. Users appear to have unlimited messaging quota.

**Fix**: Count conversations directly where `client_id = user.id OR owner_id = user.id` and `created_at >= startOfMonth`.

## Files Modified

1. **`src/hooks/useLikeNotificationActions.tsx`** — Fix `client_id` → `user_id` for matches table, remove non-existent `status`/`updated_at`/`read_at` columns
2. **`src/hooks/useDirectMessageListing.ts`** — Fix `client_id` → `user_id`, remove `status` from matches insert
3. **`src/hooks/useMessagingQuota.tsx`** — Rewrite conversation counting to query `conversations` directly by `client_id`/`owner_id` instead of going through matches
4. **DB migration** — None needed (schema is correct, code is wrong)

## What This Does NOT Change
- Swipe UI, messaging UI, design — untouched
- Notification delivery (RPC function) — working correctly
- Unread message counts — fixed in last round
- Content moderation — working correctly


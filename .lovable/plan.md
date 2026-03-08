

# Final Audit: 4 More Ghost Tables + 1 Column Mismatch

## Bug 1: `user_subscriptions.subscription_package_id` Does Not Exist (CRITICAL)

`PaymentSuccess.tsx` line 127 inserts `subscription_package_id: pkg.id` — but the actual column is `package_id`. Every subscription purchase silently fails. Users pay but never get their subscription activated.

**Fix**: Change `subscription_package_id` to `package_id` in PaymentSuccess.tsx.

## Bug 2: `saved_searches` Table Does Not Exist

`SavedSearchesDialog.tsx` queries, inserts, updates, and deletes from `saved_searches` — table doesn't exist. The entire Saved Searches feature silently fails.

**Fix**: Create `saved_searches` table with columns: `id, user_id, search_name, filters (jsonb), last_matched_at, created_at`.

## Bug 3: `push_subscriptions` Table Does Not Exist

`usePushNotifications.ts` upserts/deletes from `push_subscriptions` — table doesn't exist. Push notification subscription storage silently fails. Low priority since push notifications require a service worker setup, but the DB operations should not error.

**Fix**: Create `push_subscriptions` table with columns: `id, user_id, endpoint, p256dh, auth, platform, user_agent, created_at`. Unique constraint on `(user_id, endpoint)`.

## Bug 4: `user_security_settings` Table Does Not Exist

`useSecuritySettings.ts` queries/upserts `user_security_settings` — table doesn't exist. The hook already returns defaults gracefully, but any user changes to security settings are silently lost.

**Fix**: Create `user_security_settings` table with columns: `id, user_id, two_factor_enabled, login_alerts, session_timeout, device_tracking, created_at, updated_at`.

## Implementation Plan

### 1. DB Migration
Create 3 missing tables (`saved_searches`, `push_subscriptions`, `user_security_settings`) with RLS policies.

### 2. Code Fix — `PaymentSuccess.tsx`
Change `subscription_package_id` to `package_id` (line 127).

### After This
Every `(supabase as any)` call in the entire codebase will target real tables with real columns. Zero silent failures remaining.


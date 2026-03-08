

# Audit Round 4: 3 Remaining Issues

## Issue 1: Three Ghost RPC Functions (CRITICAL)

Three database functions are called from code but **do not exist** in the database. They are cast with `as any` to bypass TypeScript, masking the error.

| Ghost Function | Called From | Impact |
|---|---|---|
| `has_user_already_reported` | `useReporting.ts` lines 52, 102 | Duplicate report check always fails — users can spam reports, or the error silently swallows and blocks all reports |
| `increment_share_clicks` | `useSharing.ts` line 86 | Share click tracking silently fails |
| `increment_review_helpful` | `useReviews.tsx` line 499 | "Helpful" button on reviews silently fails |

**Fix**: Create all three as database functions via migration:
- `has_user_already_reported(p_reporter_id uuid, p_reported_user_id uuid, p_reported_listing_id uuid)` → returns boolean, checks `user_reports` table
- `increment_share_clicks(p_share_id uuid)` → increments a click counter on `content_shares` (needs `click_count` column added)
- `increment_review_helpful(p_review_id uuid)` → increments `helpful_count` on `reviews`

All three should be `SECURITY DEFINER` to bypass RLS for cross-user reads.

## Issue 2: Missing VAPID Secrets (Push Notifications Dead)

The `send-push-notification` edge function requires three secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. None of these exist in the configured secrets.

The frontend also requires `VITE_VAPID_PUBLIC_KEY` to subscribe users to push — also not configured.

**Impact**: Push notifications are completely non-functional. The edge function gracefully returns "push_not_configured" but no user ever receives a push notification.

**Fix**: Use `add_secret` tool to prompt user for VAPID keys. These must be generated once (Web Push key pair) and set as edge function secrets + frontend env var.

## Issue 3: `on_auth_user_created` Trigger May Be Missing

The Supabase config reports "There are no triggers in the database." The migration at `20260214172834` creates the `on_auth_user_created` trigger on `auth.users`, but since it touches a reserved schema (`auth`), it may have been rejected or dropped.

If this trigger is missing, **new signups get no profile and no role** — breaking the entire onboarding flow.

**Fix**: Verify trigger existence via a read query. If missing, re-create it in a new migration. The `handle_new_user()` function exists — only the trigger attachment may be missing.

---

## Implementation Plan

### 1. Database Migration
Create three missing RPC functions:
- `has_user_already_reported` — query `user_reports` for existing match
- `increment_review_helpful` — increment `helpful_count` on `reviews` by ID  
- `increment_share_clicks` — add `click_count` column to `content_shares`, then increment by share ID

### 2. Verify Trigger
Run a read query to check if `on_auth_user_created` trigger exists. If not, re-create it.

### 3. VAPID Secrets
Prompt user to generate and configure VAPID keys for push notification support. This is a user-action item — cannot be auto-fixed.


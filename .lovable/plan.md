

# Full Application Audit Report

## Architecture Summary

The app is a React 18 + Vite + Tailwind PWA with Supabase as the production backend (`vplgtcguxujxwrgguxqq`). It has ~50 routes, dual-role (client/owner) architecture, real-time messaging, swipe-based discovery, and a comprehensive notification system.

---

## CRITICAL BUGS FOUND

### 1. Sonner Toaster Not Mounted — 41 Files Affected

**Severity: HIGH**

The `<Toaster>` component from Sonner was removed from `App.tsx` (line 119 is just `<span />`), but **41 files** still call `toast()` from Sonner directly. These toast calls silently do nothing — users never see feedback for:
- Photo uploads, contract signing, sharing, payment confirmation
- Filter saves, escrow actions, verification requests
- Worker discovery, roommate matching, document editing
- Account deletion confirmation, camera actions

**Fix:** Either re-mount `<Toaster />` in App.tsx, or migrate all 41 files from `toast` (sonner) to `appToast` (the custom notification system).

### 2. Notification Delete Fails for Local Notifications

**Severity: MEDIUM**

In `notificationStore.ts` line 35, locally-generated notifications get a random non-UUID ID (`Math.random().toString(36).substring(2, 9)`). When the user dismisses these, `useNotificationSystem.tsx` line 171 tries to delete them from the database using this ID. The `notifications.id` column is UUID type, so the query fails with: `invalid input syntax for type uuid: "0ju7are"`.

**Fix:** In the `handleDismiss` function, check if the ID is a valid UUID before attempting the database delete. Skip the DB call for locally-generated notifications.

---

## MODERATE ISSUES

### 3. VapIdCardModal Uses Removed Toast System

The redesigned `VapIdCardModal.tsx` still imports `toast` from `sonner` (line 25). Bio saves, document uploads, and other actions in this modal produce no visible feedback.

**Fix:** Replace with `appToast` from `@/utils/appNotification`.

### 4. ConnectionGuard Calls Hook Conditionally Inside Try/Catch

In `RootProviders.tsx` line 96-97, `useConnectionHealth()` is called inside a try/catch block. While React hooks technically execute before the try/catch matters at runtime, this pattern is fragile and could cause issues with React's rules of hooks in future versions.

**Fix:** Move the hook call outside the try/catch, and wrap only the rendering logic.

### 5. Supabase Client Hardcoded to Production Project

The `src/integrations/supabase/client.ts` file has hardcoded credentials for `vplgtcguxujxwrgguxqq` (the production Supabase project), not the Lovable Cloud project (`qegyisokrxdsszzswsqk`). This is intentional per your architecture decision (production DB is source of truth), but worth noting: **the `.env` variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) are ignored** — the client always connects to production.

---

## ROUTING AUDIT — All Clear

All 50+ routes are properly defined:
- Client routes (13): dashboard, profile, settings, liked-properties, who-liked-you, saved-searches, security, services, contracts, legal-services, camera, filters, maintenance, advertise
- Owner routes (15): dashboard, profile, settings, properties, new listing, liked-clients, interested-clients, discovery, filters, client categories, view-client, saved-searches, security, contracts, legal-services, cameras
- Shared routes (10): messages, notifications, subscription packages, radio, eventos, prices, tours, intel, roommates, documents, escrow
- Admin routes (3): eventos, photos, performance (all protected by `AdminProtectedRoute`)
- Public routes (10): landing, reset-password, privacy, terms, legal, AGL, about, FAQ, profile/listing previews, VAP validate

All protected routes are wrapped in `<ProtectedRoute>` which correctly checks auth state.

---

## DATABASE/RLS AUDIT — Solid

- All 30+ tables have RLS enabled
- `user_roles` table properly prevents self-assignment of admin role via the `upsert_user_role` function
- `has_role()` security definer function prevents recursive RLS
- Sensitive tables (message_activations, user_subscriptions) correctly block direct INSERT
- Notifications table blocks INSERT (only server-side via `create_notification_for_user`)
- Storage buckets have correct public/private settings

---

## AUTH FLOW — Working Correctly

- Email/password signup and signin properly create profiles, roles, and navigate
- OAuth (Google/Apple) flow stores pending role in localStorage, handles account linking
- Sign-out clears all caches, localStorage, sessionStorage, and forces page reload
- Token refresh (`TOKEN_REFRESHED`) is handled silently without triggering loading states
- Protected routes never flash skeleton once content has been shown

---

## REAL-TIME — Properly Configured

- Notification real-time subscription on INSERT/UPDATE is active
- Match celebration uses real-time via `useMatchRealtime`
- Likes sync uses `useLikesRealtime`
- Discovery sync uses `useDiscoveryRealtime`

---

## IMPLEMENTATION PLAN

### Step 1: Re-mount Sonner Toaster
Add `<Toaster />` back to `App.tsx` so all 41 files that call `toast()` work again. This is the fastest fix since migrating 41 files to `appToast` would be a much larger change.

### Step 2: Fix notification delete for non-UUID IDs
In `useNotificationSystem.tsx`, guard the delete call:
```typescript
// Only attempt DB delete if the ID looks like a UUID
const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/.test(id);
if (user?.id && isUUID) {
  supabase.from('notifications').delete()...
}
```

### Step 3: Fix ConnectionGuard hook pattern
Move `useConnectionHealth()` outside the try/catch in `RootProviders.tsx`.

### Files to change:
- `src/App.tsx` — re-add `<Toaster />`
- `src/hooks/useNotificationSystem.tsx` — UUID guard on delete
- `src/providers/RootProviders.tsx` — fix hook pattern


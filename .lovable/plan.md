

## Final Stability Hardening + iOS App Store Readiness

### Current State
The app is currently running without runtime errors. The previous crash chain (useState null, useNavigate outside Router, failed dynamic imports, reload loops) has been resolved. GlobalDialogs uses DeferredDialog gating, lazyRetry no longer reloads, and the prefetcher excludes heavy modal chains.

### What This Plan Covers
Three focused areas: (1) add a chunk-load ErrorBoundary so failed lazy imports never produce a blank screen again, (2) wrap the PushNotificationPrompt in DeferredDialog like everything else, (3) generate the iOS PrivacyInfo.xcprivacy file required by Apple.

---

### Step 1: Create a ChunkErrorBoundary component
**File**: `src/components/ChunkErrorBoundary.tsx` (new)

A lightweight React error boundary that catches dynamic import failures (the "Failed to fetch dynamically imported module" pattern). Instead of a blank screen, it renders a simple retry button. This wraps around the `GlobalDialogs` render in `PersistentDashboardLayout` and around the dashboard route's Suspense boundaries.

- Catches errors where `message` includes "dynamically imported module" or "Loading chunk"
- Renders a minimal "Something went wrong -- Tap to retry" UI
- Calls `window.location.reload()` only on explicit user tap (never automatically)

### Step 2: Wrap GlobalDialogs in ChunkErrorBoundary
**File**: `src/components/PersistentDashboardLayout.tsx`

Import `ChunkErrorBoundary` and wrap the `<DashboardLayout>` children so any lazy modal failure is caught and contained without killing the dashboard.

### Step 3: Gate the PushNotificationPrompt
**File**: `src/components/GlobalDialogs.tsx`

The `PushNotificationPrompt` on line 209-211 is currently rendered inside a bare `SmartSuspense` without `DeferredDialog` gating. If its chunk fails to load, it crashes the entire dialog tree. Change it to only mount after a short delay using a local `useEffect` + state flag, or wrap it in `DeferredDialog` with a `when` condition tied to app warmup.

### Step 4: Create PrivacyInfo.xcprivacy
**File**: `ios/App/App/PrivacyInfo.xcprivacy` (new)

Apple requires this since Spring 2024. The XML declares required reason API usage:
- `NSPrivacyAccessedAPICategoryUserDefaults` -- reason `CA92.1` (app functionality via localStorage/sessionStorage used by Supabase auth, theme, filters)
- `NSPrivacyAccessedAPICategorySystemBootTime` -- reason `35F9.1` (if date-fns or performance timing is used)
- `NSPrivacyCollectedDataTypes` -- identifiers (Supabase user ID), email for auth
- No tracking declared (`NSPrivacyTracking = false`)

### Step 5: Clean up routePrefetcher safety
**File**: `src/utils/routePrefetcher.ts`

The prefetcher currently includes `/client/liked-properties` in the route map (line 50) even though it was removed from the critical prefetch list. Remove it from `routeImports` entirely so hover/viewport prefetch also cannot trigger the heavy modal chain. Add a `.catch(() => {})` safety net to the `critical.forEach` calls (lines 156, 177) so a failed prefetch never throws unhandled.

### Step 6: Capacitor config final polish
**File**: `capacitor.config.ts`

Minor additions for App Store readiness:
- Add `allowNavigation: ['*.supabase.co']` so WKWebView allows Supabase API calls
- Ensure `webDir: 'dist'` is correct (already is)

---

### Files Summary
| File | Action |
|------|--------|
| `src/components/ChunkErrorBoundary.tsx` | Create |
| `src/components/PersistentDashboardLayout.tsx` | Wrap with ChunkErrorBoundary |
| `src/components/GlobalDialogs.tsx` | Gate PushNotificationPrompt |
| `ios/App/App/PrivacyInfo.xcprivacy` | Create |
| `src/utils/routePrefetcher.ts` | Remove liked-properties, add safety catches |
| `capacitor.config.ts` | Add allowNavigation |

### What This Does NOT Change
- No routing, swipe physics, or layout changes
- No Supabase/auth/RLS changes
- No component restructuring or design changes
- No new dependencies

### Post-Implementation
After these changes, the build + iOS sync sequence is:
```
npm run build && npx cap sync ios && npx cap open ios
```


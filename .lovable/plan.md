
Goal: fully stabilize access by fixing all compile-time blockers first, then hardening runtime paths causing the dashboard crash.

Do I know what the issue is? Yes.
There are 3 root causes:
1) TypeScript regressions from recent UI edits (the listed build errors).
2) Type drift between two different `ListingFilters` type definitions.
3) Runtime instability on `/dashboard` (React #185 / max update depth symptoms) likely amplified by backend config drift and repeated error/re-render paths.

What is noise vs real blocker from your logs:
- Noise (not app-breaking): adblocker `ERR_BLOCKED_BY_ADBLOCKER`, marketing pixel timeouts, consent warnings, iframe sandbox warnings.
- Real blockers: React error #185, failing app route render to error boundary, and mismatched backend URL usage in app requests.

Implementation plan (in order)

1) Unblock build (strict compile fixes)
- Replace all `NodeJS.Timeout` refs with browser-safe timeout type:
  - `ReturnType<typeof setTimeout>`
  - Files:
    - `src/components/CategorySelectionDialog.tsx`
    - `src/components/MessagingInterface.tsx`
    - `src/components/SwipessSwipeContainer.tsx`
    - `src/contexts/RadioContext.tsx`
    - `src/hooks/useAuth.tsx`
    - `src/hooks/useFilterPersistence.ts`
    - `src/hooks/useRealtimeChat.tsx`
    - `src/pages/MessagingDashboard.tsx`
- Add missing import in `src/components/MyHubActivityFeed.tsx`:
  - `import { Button } from '@/components/ui/button';`
- Fix profile field mismatches in `src/components/MyHubProfileHeader.tsx`:
  - Replace `ownerProfile.full_name` → `ownerProfile.business_name`
  - Replace `ownerProfile.bio` → `ownerProfile.business_description`
  - Replace `location` access with derived string from known fields:
    - client: `city/country/neighborhood`
    - owner: `business_location`
- Fix quick-filter typing/haptics in `src/components/MyHubQuickFilters.tsx`:
  - category id `'moto'` → `'motorcycle'`
  - `haptics.selection()` → `haptics.select()`
- Fix notifications haptics and nullable user id in `src/pages/NotificationsPage.tsx`:
  - `haptics.impact('light')` → valid haptic call (`triggerHaptic('light')` or `haptics.tap/select`)
  - guard `if (!user?.id) return` before delete query, then use `user.id` (non-optional).

2) Remove type drift (prevents repeat breakage)
- Unify `ListingFilters` so dashboard/filter/store/smart-matching all use one source of truth.
- Preferred approach:
  - In `src/hooks/smartMatching/types.ts`, alias/export `ListingFilters` from `src/types/filters`.
  - Keep smart-matching-specific types for matched entities only.
- This resolves:
  - `src/pages/MyHub.tsx` filter type incompatibility
  - downstream casts between `ClientDashboard` and `SwipessSwipeContainer`.

3) Fix messaging role typing at boundary
- In `src/pages/MessagingDashboard.tsx` (and optionally `src/hooks/useConversations.tsx`), enforce:
  - `role: 'client' | 'owner'` instead of `string`
- Normalize `otherUser` before passing to `MessagingInterface`:
  - `role = otherUser.role === 'owner' ? 'owner' : 'client'`
- This resolves the `otherUser` prop assignment error safely.

4) Runtime access audit + hardening (/dashboard crash)
- Backend config correction:
  - App requests are hitting an old backend project ref in runtime.
  - Restore generated backend client configuration to current project env values (no stale hardcoded fallback behavior).
- React #185 hardening:
  - Add defensive short-circuiting for repeated failed fetch paths (especially listing/feed hooks) to avoid cascading state updates/toasts.
  - Ensure any error toast/state update is deduped/throttled during persistent backend failure states.
  - Keep error paths returning stable values (`[]` / `null`) without triggering reset loops.

5) Verification checklist (must pass before closing)
- Typecheck/build: zero TS errors.
- Route smoke tests:
  - `/dashboard` loads without error boundary.
  - `/messages` opens conversation list and thread.
  - `/notifications` can remove single item and unlike without TS/runtime errors.
- Data path checks:
  - network requests target the current project backend (not old project ref).
  - listing fetches return valid status and no infinite retry/render loop.
- Stability:
  - no recurring React #185 after refresh + navigation back to `/dashboard`.

Technical notes (for implementation quality)
- Keep timeout typing browser-native to avoid coupling app tsconfig to Node globals.
- Don’t keep duplicate filter interfaces in multiple modules.
- Normalize role/type data at integration boundaries (API → UI props).
- Treat adblocker/marketing script console noise as non-blocking unless core app APIs fail.

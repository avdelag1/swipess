# Speed-of-Light Polish Pass

Goal: every tap feels instant, every page route is reliable, quick filter cards snap in without flicker or layout shift, and all buttons give crisp feedback. No structural rewrites — pure refinement on top of the existing architecture.

---

## 1. Navigation reliability (fix the "buttons/pages don't work" feel)

- **Harden `useAppNavigate`**: wrap `document.startViewTransition` callback in a try/catch and `requestAnimationFrame` so a failed transition never blocks the route change. Fallback path already exists; ensure it always runs.
- **Sweep all pages for `<Link to="...">` vs `onClick={() => navigate(...)}` inconsistencies** on primary CTAs (Landing, SignIn, SignUp, Client/Owner Dashboard top bar, Explore hub, Filters cards). Standardize on `useAppNavigate` so prefetch + haptic fire on every nav.
- **Confirm route table in `App.tsx`** has lazy chunks for: `/client/filters`, `/owner/filters`, `/explore`, `/messages`, `/notifications`, `/client/perks`, `/client/liked`, `/owner/properties`, `/subscription`. Add `prefetchRoute` on hover/pointerdown for nav bar items (extend existing pattern).
- **Guard the `ChunkErrorBoundary`** with a one-shot auto-reload when a `ChunkLoadError` is caught (stale deploy = white screen today).

## 2. Quick filter cards — instant + flicker-free

- **Preload filter card images** (`POKER_CARD_PHOTOS`) at app boot via the existing `Resource Loading Strategy` pattern, with `fetchPriority="high"` and `decode()` warm-up.
- **Switch filter grid to CSS containment** (`contain: layout paint style`) and fixed aspect-ratio wrappers to eliminate layout shift while images decode.
- **Replace any conditional mount transitions** with a stable mount + opacity fade (150ms) keyed on image `onLoad` to prevent the "pop-in" flash.
- **Memoize the filter card list** (`React.memo` + stable keys) so re-renders from filter selection don't re-mount siblings.
- **Persist last selected filter instantly** to local state before the network round-trip (optimistic UI), then reconcile with `client_filter_preferences`.

## 3. Button responsiveness everywhere

- **Audit primary buttons** (Landing CTAs, Auth submit, Dashboard floating actions, swipe like/pass, filter chips, Explore tiles) and ensure each has:
  - `:active` scale 0.96 + 80ms ease-out (per Interaction Responsiveness memory)
  - Haptic on pointerdown (not click) for sub-100ms perceived latency
  - `touch-action: manipulation` to remove the 300ms tap delay where missing
  - `disabled` state that visibly dims and blocks double-fire
- **Wrap async button handlers** with an in-flight ref to prevent duplicate submits (signup/login already had a duplicate-AI-send pattern — apply same to nav buttons that fetch).

## 4. Page-level perceived speed

- **Add route-level skeletons** for Filters, Liked, Messages, Notifications (currently fall back to `null` Suspense). Skeletons match final layout to kill CLS.
- **Bump `SwipessPrewarmer` priority**: prefetch `/client/filters` and `/explore` chunks alongside dashboard since users hit those next.
- **Defer non-critical effects** on first paint: push `useNotifications`, `usePushNotifications`, and `useEnsureSpecializedProfile` behind the existing 100ms `AppLifecycleManager` gate (already done) — verify nothing else runs synchronously in providers.

## 5. Swipe deck micro-polish (carry-over from last session)

- Verify the dark frame fix from last turn still holds in light mode after route changes (toggle `swipe-deck-active` class on body cleanup).
- Confirm card image `border-radius: inherit` covers all corners on the 393×731 viewport — no white bleed.

---

## Files likely touched

- `src/hooks/useAppNavigate.ts` (transition guard)
- `src/components/ChunkErrorBoundary.tsx` (auto-reload)
- `src/pages/ClientFilters.tsx`, `src/pages/OwnerFilters.tsx` (card grid + memo + preload)
- `src/components/SwipessPrewarmer.tsx` (extend prefetch list)
- `src/visual/PremiumButton.tsx` + scattered button usages (active/haptic/touch-action sweep)
- `src/App.tsx` (Suspense skeletons per route)
- `src/components/LegendaryLandingPage.tsx`, auth pages (CTA standardization)

## Out of scope

- No new features, no layout architecture changes, no swipe physics changes (per evolution doctrine: enhance, don't mutate).

Approve and I'll execute the full sweep in one pass.
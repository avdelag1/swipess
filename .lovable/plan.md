## Goal

Make Swipess feel like a premium native app (Tinder / Airbnb / TikTok class). Stop unmounting the dashboard, stop showing splash flashes between routes, and keep only one focused animation at a time so low-memory Android devices stay at 60 FPS.

## Diagnosis (current pain)

- Every protected route is a separate `lazyWithRetry` chunk under `PersistentDashboardLayout` → `AnimatedOutlet`. The "persistent" layout only persists header/nav; the dashboard itself unmounts on every navigation, which causes splash flashes, image reloads, and state-restoration lag.
- `AnimatedOutlet` cross-fades route children with `position: absolute`, but the entering chunk still has to load + Suspense, so users see a blank `SuspenseFallback` between pages.
- `PokerCategoryCard` runs continuous breathing scale + opacity + cross-fade on every card in the deck (not just the top one). Combined with `AtmosphericLayer`, parallax, and category-photo cross-fades, several layers animate at once.
- Gesture conflicts: deck has X-swipe, peek has Y-swipe, fullscreen has pull-down dismiss, plus tap-to-toggle-chrome. They all live on overlapping surfaces.
- Splash/logo screen is gated by `swipess-ready` event with a 2.5s safety timer — it can re-appear when chunks load slowly.

## Plan

### 1. Persistent Dashboard Scene (architectural)

- Keep `ClientDashboard` and `EnhancedOwnerDashboard` mounted once, behind every dashboard-adjacent route.
- Convert these "secondary" routes into **overlay layers** that slide above the dashboard instead of replacing it:
  - Properties / listings / new listing
  - Filters (client + owner)
  - Liked / Who-liked-you / Interested
  - Notifications, Subscription packages
  - Profile, Settings, Security
- Implementation: introduce a single `<DashboardScene>` component rendered once inside `PersistentDashboardLayout`. It holds `<ClientDashboard>` (or owner equivalent) always mounted, plus a `<RouteOverlayHost>` that reads the URL and renders a fullscreen overlay on top using `framer-motion` translateY + opacity. URL stays the source of truth (back button still works), but the dashboard is never unmounted.
- Routes that genuinely need a different scene (Messaging, Radio, Eventos feed, Camera, Admin) keep using the normal route swap path — they're not "above the dashboard," they're separate scenes.

### 2. Kill the splash flash between pages

- Remove `SuspenseFallback` from inside the protected `AnimatedOutlet`. Replace with `null` so the previous frame stays painted while the next chunk loads.
- Preload all dashboard-adjacent chunks immediately after auth resolves (extend `routePrefetcher` with a "dashboard cluster" group fired from `SwipessPrewarmer`).
- Drop the 2.5 s `AuthReadySignal` safety timer to ~600 ms so the boot splash never lingers after first paint.

### 3. Animation budget — one focused animation at a time

- `PokerCategoryCard`: only the top card runs the breathing scale/cross-fade. Stacked cards behind get static `transform: translateY` + `scale` and `opacity` only.
- Move category photo cross-fade from a continuous loop to "advance only when top card is idle and tab visible" (use `IntersectionObserver` + `document.visibilityState`).
- Gate `AtmosphericLayer` to a single low-cost gradient on Android low-memory devices (detect via `navigator.deviceMemory <= 4` or `prefers-reduced-motion`).
- Replace combined `scale + blur + shadow + opacity` transitions with `transform + opacity` only. Shadows become static layered tokens, not animated.

### 4. Gesture isolation

- Dashboard deck: horizontal pan only (`dragDirectionLock`, `dragElastic` on x, y locked).
- Fullscreen overlay: vertical dismiss only.
- Tap-to-reveal-chrome stays on the deck, but the edge-detection logic moves into a single `useDeckGestures` hook so PokerCategoryCard and PeekCard share one source of truth and never both consume the same pointer event.
- Remove `usePullDownToDismiss` from places where the overlay host already owns Y-axis.

### 5. Image performance

- Add a low-res preview (320 px AVIF/WebP) for every poker card photo. Show preview immediately, swap to full-res once decoded with `img.decode()`.
- Centralize image preloading in `lib/swipe/ImagePreloadController` (already exists) and call it from the new dashboard cluster preloader. Drop the per-card `new Image()` calls in `PokerCategoryCard`.
- Add `loading="lazy"` + `decoding="async"` everywhere except the visible top card.

### 6. UI thread hygiene

- Audit `useEffect`s that run on every render in `PokerCategoryCard`, `SwipeAllDashboard`, `ClientDashboard` and memoize/condition them.
- Replace any `setState` inside drag handlers with `useMotionValue` updates so React doesn't re-render on each frame.
- Mark heavy children with `memo` and stable callback refs.

### 7. Dashboard return animation

- Overlay closes by animating its own `translateY: 100%` + opacity to 0. Dashboard underneath is untouched — no remount, no scroll reset, no image reload. Feels like "revealing," not "loading."

### 8. Verification

- Manual: navigate Dashboard → Properties → back; record with Chrome perf tab. Target: no Suspense fallback frame, no LCP > 16 ms during transition, sustained 60 FPS while swiping.
- Lighthouse mobile run before/after on `/client/dashboard`.

## Scope of file changes (technical detail)

- New: `src/components/dashboard/DashboardScene.tsx`, `src/components/dashboard/RouteOverlayHost.tsx`, `src/hooks/useDeckGestures.ts`.
- Edit: `src/App.tsx` (route grouping), `src/components/PersistentDashboardLayout.tsx` (mount DashboardScene), `src/components/AnimatedOutlet.tsx` (overlay-aware), `src/components/swipe/PokerCategoryCard.tsx` (animation gating), `src/components/swipe/SwipeAllDashboard.tsx`, `src/providers/RootProviders.tsx` (boot timer), `src/utils/routePrefetcher.ts` (dashboard cluster), `src/components/AtmosphericLayer.tsx` (low-mem mode).
- Out of scope: visual redesign, business logic, RLS, auth, copy.

## Risk & rollout

- Biggest risk: route → overlay mapping. We start with **Properties + Filters + Liked/Interested** as overlays in phase 1. Profile/Settings stay as normal routes in phase 1 and become overlays in phase 2 if phase 1 is stable.
- Each overlay is feature-flagged via a small `OVERLAY_ROUTES` set so we can revert per-route without a rebuild.

## Out of this plan

- Listing/data fetching changes — none.
- Database / edge function changes — none.
- Visual identity, color tokens, copy — unchanged.

If this looks right I'll implement Phase 1 (persistent scene + overlay host for Properties/Filters/Liked, splash-flash removal, animation gating). Phase 2 (more overlays + low-res image previews) follows after we confirm phase 1 feels right.
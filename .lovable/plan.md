

## Final iOS Audit + Performance & Backend Connectivity Hardening

### Issues Found

**1. Critical: `Missing queryFn` error in SwipeAllDashboard.tsx (line 56-58)**
The `prefetchQuery` call uses only a `queryKey` and `staleTime` but no `queryFn`. If the query hasn't been cached yet by `useSmartListingMatching`, the prefetch throws. Same issue on line 51-53 for owner mode. Fix: supply the actual `queryFn` or wrap in a try-catch with a no-op fallback.

**2. React CSS warning: `animation` + `animationPlayState` conflict (PokerCategoryCard.tsx line 211-212)**
React warns about mixing shorthand (`animation`) with longhand (`animationPlayState`) on the same element. Fix: use only longhand properties (`animationName`, `animationDuration`, `animationTimingFunction`, `animationDelay`, `animationIterationCount`, `animationPlayState`).

**3. Sonner toast still imported in 78 files**
Memory says "No legacy toasts (Sonner). Use unified NotificationBar." But `Toaster` from Sonner is still rendered in `App.tsx` line 121, and 78 files import `toast` from sonner. This is not a blocker for iOS but creates inconsistency.

**4. iOS Privacy Manifest looks correct** -- UserDefaults + SystemBootTime declared. Good for App Store.

**5. Splash screen logic is solid** -- 1.5s max timeout with `app-rendered` event override. No blank screen risk.

**6. `sourcemap: true` in production build (vite.config.ts line 78)**
Sourcemaps ship to production, increasing bundle size and exposing source code. For iOS WebView performance, disable in production.

### Plan

| # | Task | File(s) |
|---|------|---------|
| 1 | Fix `prefetchQuery` missing `queryFn` -- add the actual fetch function from `useSmartListingMatching` or wrap in try-catch | `src/components/swipe/SwipeAllDashboard.tsx` |
| 2 | Fix CSS shorthand conflict -- replace `animation` + `animationPlayState` with individual longhand properties | `src/components/swipe/PokerCategoryCard.tsx` |
| 3 | Disable sourcemaps in production build | `vite.config.ts` (line 78: `sourcemap: false`) |
| 4 | Add `will-change: transform` to key animated elements for GPU compositing on iOS Safari | `src/components/swipe/PokerCategoryCard.tsx`, `src/components/BottomNavigation.tsx` |
| 5 | Ensure all Supabase queries in Perks feature handle loading/error states gracefully | `src/components/perks/PerksDashboard.tsx` (already has loading state -- verify error handling) |
| 6 | Remove `Toaster` (Sonner) from App.tsx since NotificationBar is the standard | `src/App.tsx` (line 121) |

### What this achieves
- Eliminates the `Missing queryFn` runtime error (the most visible console error)
- Fixes the React CSS property collision warning
- Reduces production bundle size (no sourcemaps)
- Smoother iOS Safari rendering via GPU hints
- Cleaner notification system (single source of truth)


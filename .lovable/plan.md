

# Fix Radio + Remove Performance Bottlenecks

## Problem 1: Radio Can't Open (Root Cause Found)

The `<main>` scroll container in `DashboardLayout.tsx` (line 513) has `transform-gpu` CSS class. This creates a **new CSS containing block**, which causes the radio's `position: fixed; inset: 0; z-index: 50` to be positioned relative to the scroll container instead of the viewport. The radio renders but is clipped and trapped inside the scrollable area.

**Fix**: Remove `transform-gpu` from the main scroll container's className on line 513. This class is unnecessary here — it was added as a perceived performance hint but actually causes layout bugs. The radio will then properly fill the viewport.

Additionally, when the route is a fullscreen route (radio), the main container already sets `overflow-y: hidden`, so the radio's fixed positioning should work correctly once `transform-gpu` is removed.

**File**: `src/components/DashboardLayout.tsx` line 513
- Remove `transform-gpu` from the className string

## Problem 2: SpeedInsights Crash (Still Present)

`RootProviders.tsx` still has the `@vercel/speed-insights` dynamic import (lines 114-126) and render (line 138). This causes an "Invalid hook call" crash when the module loads with a separate React instance.

**Fix in `src/providers/RootProviders.tsx`**:
- Remove the `SpeedInsights` state variable (line 114)
- Remove the `useEffect` that imports `@vercel/speed-insights` (lines 116-126)
- Remove `{SpeedInsights && <SpeedInsights />}` from the JSX (line 138)

## Problem 3: Performance — Heavy Background Layers

Still present in `RootProviders.tsx`:
- `SentientBackgroundLayer` (lines 82-94) — GPU-heavy ambient mesh animation
- `PredictiveBundleLoader` (line 144) — redundant prefetching (ZenithPrewarmer already does this)

**Fix in `src/providers/RootProviders.tsx`**:
- Remove the `SentientBackgroundLayer` component and its render (line 140)
- Remove imports: `AmbientMeshBackground`, `useVisualTheme`, `PredictiveBundleLoader`
- Remove `<PredictiveBundleLoader />` from JSX (line 144)

## Problem 4: Performance — AppLayout Overhead

`AppLayout.tsx` has:
- `VisualEngine` lazy-loaded (lines 62-64) — purely cosmetic, adds JS weight
- Animated `motion.div` with `filter: blur()` transitions on gradient masks (lines 68-83) — causes GPU compositing on every scroll state change
- `useFocusMode` and `useScrollDirection` hooks running at root level

**Fix in `src/components/AppLayout.tsx`**:
- Remove the `VisualEngine` lazy import and its `<Suspense>` render
- Replace the `motion.div` wrapper around gradient masks with a static `div` using CSS transitions (much cheaper than framer-motion for simple opacity)
- Remove the `filter: blur()` animation — it causes full-layer GPU recomposition

## Problem 5: Lifecycle Delay Too Long

`AppLifecycleManager` waits 6 seconds before activating lifecycle hooks (notifications, profile sync). This means the app feels "dead" for 6s.

**Fix**: Reduce delay from 6000ms to 3000ms in `RootProviders.tsx` line 67.

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/DashboardLayout.tsx` | Remove `transform-gpu` from main scroll container |
| `src/providers/RootProviders.tsx` | Remove SpeedInsights, SentientBackgroundLayer, PredictiveBundleLoader; reduce lifecycle delay to 3s |
| `src/components/AppLayout.tsx` | Remove VisualEngine; replace motion.div gradient wrapper with static CSS |

## Expected Results
- Radio opens fullscreen immediately when navigating to `/radio`
- App no longer crashes from SpeedInsights hook error
- Faster TTI (~2-3s improvement) from removing GPU-heavy layers
- Buttons and header react immediately (no blur/filter GPU overhead)


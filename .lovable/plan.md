

## Fix Map Visibility + Adaptive User Pill + Card Sizing

### Diagnosis

**Why the map won't open** (the critical issue): there are **9 build errors** blocking the app from compiling. The map specifically fails because `DiscoveryMapView.tsx` references `handleDetectLocation` (lines 597, 628) which doesn't exist — the actual function is `detectLocation`. Until these errors are fixed, no route renders properly.

**Other blockers preventing the map from showing:**
- `OwnerDiscovery.tsx:215` casts `'service'` to `RadarCategory` but the type union is `'worker'` not `'service'`.
- `DiscoveryMapView.tsx:244,252` compare `category` (which is `QuickFilterCategory` = `'property'|'motorcycle'|'bicycle'|'services'`) against `'worker'`, which TS flags as impossible.
- `DiscoveryMapView.tsx:530` passes `false` to `exit` prop — Framer requires `undefined`.
- `SwipeExhaustedState.tsx:236` uses `'all'` which isn't in `QuickFilterCategory`.
- Three other unrelated files (`BottomNavigation`, `VapIdEditModal`, `MessagingDashboard`, `ClientFilters`) have errors that also prevent build.

### Plan

**1. Fix all 9 build errors so the app compiles and the map renders.**

| File | Fix |
|---|---|
| `DiscoveryMapView.tsx` | Rename `handleDetectLocation` → `detectLocation` (2 spots). Drop the `'worker'` comparisons in `selectedCategoryDb` and `isDotMatching` — just use `category` directly (DB normalization happens in the matching hook, not here). Replace `exit={isEmbedded ? false : {...}}` with `exit={isEmbedded ? undefined : {...}}`. |
| `OwnerDiscovery.tsx` | Map `'worker' → 'services'` when passing to `DiscoveryMapView` (already done) and accept `'services'` back, converting to `'worker'` for local state (already done). The remaining error is the `category` prop type — narrow the cast to satisfy `QuickFilterCategory`. |
| `SwipeExhaustedState.tsx:236` | Default to `'property'` instead of `'all'`. |
| `BottomNavigation.tsx:329` | Remove the extra argument from the haptic call. |
| `VapIdEditModal.tsx:155` | Wrap object in array or fix the upsert payload shape. |
| `ClientFilters.tsx:61,66` & `MessagingDashboard.tsx:272` | `haptics.selection()` → `haptics.select()`. |
| `MessagingDashboard.tsx:123,125` | Remove `match_id` references — use `id` instead. |
| `MessagingDashboard.tsx:264,266` | Add missing `Layers, Sparkles` imports from `lucide-react`. |
| `NotificationPopover.tsx` | Already pending — confirm `haptics.success()` was applied. |

**2. Make the user-name pill adapt to the actual name length.**

In `TopBar.tsx` (lines 145–152): currently the name is clipped at `max-w-[120px]` and truncated at 10 chars via JS. Change to:
- Drop `max-w-[120px]`, allow the pill to grow naturally.
- Keep the 10-char hard cap (`.substring(0, 10)`) so super-long names don't break the layout.
- Add `min-w-0` and `whitespace-nowrap` so flex wraps cleanly.
- The right-side action cluster (`Radio`, `ThemeToggle`, `NotificationPopover`) already uses `flex-shrink-0` and the centered logo is absolutely positioned — they'll naturally compress/shift when the pill grows. To keep the layout fluid, change the centered logo hit area (line 163) to not block flex space: it's already `absolute`, good. Add `flex-wrap: nowrap` and `gap` adjustments so the right cluster moves rather than overlapping.

**3. Make swipe cards reach closer to the bottom navigation bar.**

In `src/index.css`, the `--card-height` formula subtracts `200px` (mobile), which leaves a visible gap above the nav bar. Tighten:
- Mobile: `calc(100svh - 156px)` (was `200px`) and bump `max` to `680px`.
- Tablet: `calc(100svh - 200px)` and `max 720px`.
- Desktop: keep larger margins.

Also in `SwipeAllDashboard.tsx:108`: change `maxHeight: 'min(600px, calc(100svh - 240px))'` → `'min(720px, calc(100svh - 180px))'` so the poker stack fills nearly to the bottom nav, leaving only ~12–16px breathing room.

**4. Verify the dashboard map flow end-to-end.**
After the build compiles: tap a poker card on `/client/dashboard` → confirm `phase` flips to `'map'` and `DiscoveryMapView` mounts (it's `isEmbedded={false}` by default, rendering as `fixed inset-0 z-[10000]`). Same flow for owner: tap "Find Buyers" / "Find Workers" on Owner Discovery → confirm the map opens in the embedded container.

### Files Modified
- `src/components/swipe/DiscoveryMapView.tsx` — rename `handleDetectLocation`, drop `'worker'` literal compares, fix `exit` prop
- `src/pages/OwnerDiscovery.tsx` — type-correct category cast
- `src/components/swipe/SwipeExhaustedState.tsx` — default `'property'`
- `src/components/BottomNavigation.tsx` — remove extra haptic arg
- `src/components/VapIdEditModal.tsx` — fix upsert payload
- `src/pages/ClientFilters.tsx` — `haptics.select`
- `src/pages/MessagingDashboard.tsx` — imports, `match_id` → `id`, `haptics.select`
- `src/components/TopBar.tsx` — adaptive pill width
- `src/index.css` — tighter card-height math
- `src/components/swipe/SwipeAllDashboard.tsx` — larger maxHeight cap


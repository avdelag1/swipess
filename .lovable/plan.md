

## Plan: Fix Radar Layout, Auto-Stop, and Motorcycle Filter

### Problems

1. **Distance selector cut off** — The radar + text + button + distance card don't fit in the viewport. The content overflows below the visible area.
2. **Radar animation may not stop** — Need to ensure the sweep beam and ripples fully stop after 6 seconds and do NOT animate on initial load (only on refresh click).
3. **Motorcycle quick filter button** — Need to verify it properly triggers category switch and loads motorcycle listings.

### Changes

#### 1. Compact the Exhausted State Layout (`SwipeExhaustedState.tsx`)

- Reduce radar `size` from 128 to 96 (smaller radar, less vertical space)
- Reduce icon size inside radar from `h-9 w-9` to `h-6 w-6`
- Reduce gaps between elements: `gap-6` to `gap-3`, `gap-5` to `gap-3`
- Reduce vertical padding: `py-5` to `py-2`, `pt-4` to `pt-2`, `pb-5` to `pb-3`
- Reduce the distance card padding from `p-5` to `p-4`, border-radius from `rounded-[2rem]` to `rounded-2xl`
- Make the "No new listings" heading smaller: `text-xl` to `text-base`
- Make the Refresh button slimmer: `h-13` to `h-10`, smaller padding
- Remove `justify-center` from the main flex column — use `justify-start` so content flows from top and distance card is visible

#### 2. Fix Radar Auto-Stop Guarantee (`RadarSearchEffect.tsx`)

- Ensure initial state: `useState(isActive)` — when `isActive` is false on mount, no animation runs
- Add a guard: when `animating` transitions to false, force-cancel any lingering Framer Motion animations by using `animate={animating ? {...} : false}` pattern (using `false` instead of static values stops transitions)
- The sweep beam's `repeat: Infinity` inside AnimatePresence should unmount cleanly when `animating=false`, but add explicit `exit` transitions to ensure clean teardown

#### 3. Fix Motorcycle Quick Filter (`SwipeExhaustedState.tsx`)

- The `handleCategorySwitch` calls `setCategories([catId])` which sets `activeCategory` to the category
- Verify the `MotorcycleIcon` component properly accepts and forwards `strokeWidth` prop — currently it does via `{...props}` spread, but it also has a hardcoded `strokeWidth={2}` on the SVG element. The spread `{...props}` comes AFTER `strokeWidth={2}`, so the passed `strokeWidth={2.35}` should override. This should work.
- The real issue may be that `motorcycle` as a category ID doesn't match what the swipe containers expect. Check that `useSmartMatching` properly handles `motorcycle` category. If the hook filters by `listing_type` or similar, the motorcycle value needs to match.

### Files Modified

1. **`src/components/swipe/SwipeExhaustedState.tsx`** — Compact layout: smaller radar, tighter spacing, visible distance card, `justify-start` instead of `justify-center`
2. **`src/components/ui/RadarSearchEffect.tsx`** — Ensure clean animation stop with explicit exit props on sweep beam and ripples

### Technical Detail

The core layout fix is changing the flex container from `justify-center` to `justify-start` with controlled gaps. Currently `justify-center` pushes the distance card below the fold when the radar + text take up the center. With `justify-start`, elements stack from top down and the distance card stays visible within the scrollable area.


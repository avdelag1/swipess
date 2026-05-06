# Remove the Radar Effect & Clean Up Legacy Visuals

## What you're seeing in the screenshot

The big oval/circular shape behind the loading skeleton is a **radar sweep animation** baked into `SwipeLoadingSkeleton.tsx`. It draws three concentric rings + a rotating conic-gradient pulse while the deck loads. It's leftover from the old "radar map" paradigm — before we moved to the kilometer slider you approved.

It's the only place in the swipe deck that still renders a radar visual. There is no full radar page anymore — that was already removed. But three radar artifacts remain in the code, and one unused component is still shipped.

## What to remove

### 1. Radar rings + sweeping pulse in the loading skeleton
File: `src/components/swipe/SwipeLoadingSkeleton.tsx`
- Delete the concentric rings (lines 24–28)
- Delete the rotating conic-gradient sweep (lines 31–38)
- Keep only the dark surface + shimmer + bottom info skeleton bars (clean Apple-style loading state)

### 2. Radar overlay in the filter "Initiate Scan" flow
File: `src/pages/ClientFilters.tsx`
- Replace the full-screen scanning overlay (lines 209–243) with a simple subtle progress indicator (spinner + "Synchronizing" text), no radar rings, no conic-gradient sweep
- Replace the `Radar` lucide icon on the Scan button (line 191) with a cleaner `Search` or `Crosshair` icon
- Remove the `Radar` import

### 3. Delete the unused RadarSearchEffect component
File: `src/components/ui/RadarSearchEffect.tsx`
- The big `RadarSearchEffect` export is **never imported anywhere**
- Only `RadarSearchIcon` (small) is used by `MarketingSlide.tsx`
- Slim the file down to export only `RadarSearchIcon`, OR move that small icon inline into `MarketingSlide.tsx` and delete the file entirely (preferred — fewer files)

### 4. Quick dead-route audit (housekeeping you asked for)
Confirm and remove if found:
- No `/radar` or `/map` route exists in `src/App.tsx` (already verified clean)
- `LocationRadiusSelector.tsx` keeps copy like "Sector Depth / Scanning radius" — refine to plain language: "Search radius" / "Distance"
- Verify `radarNodes` memo in `ClientSwipeContainer.tsx` (line 165) is still consumed; if unused after these changes, delete it

## Result

- Loading state: clean dark card with shimmer + bottom skeleton bars only — no radar shapes, no sweep
- Filter scan: simple "Synchronizing…" toast/spinner — no full-screen radar overlay
- Codebase: one fewer unused component, no leftover radar references in the swipe flow
- The kilometer selector (`LocationRadiusSelector`) remains the single source of truth for distance, exactly as you specified

## Files touched

- `src/components/swipe/SwipeLoadingSkeleton.tsx` — strip radar visuals
- `src/pages/ClientFilters.tsx` — replace scanning overlay, swap icon
- `src/components/ui/RadarSearchEffect.tsx` — delete (move small icon inline)
- `src/components/MarketingSlide.tsx` — update import after move
- `src/components/ClientSwipeContainer.tsx` — remove `radarNodes` if dead, refine copy
- `src/components/swipe/LocationRadiusSelector.tsx` — refine "Sector Depth" copy

No routes, no logic, no swipe physics, no DB changes.
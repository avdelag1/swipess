

## Fix Errors, Improve Swipe Sensitivity, Tokens Dismiss, Responsive Cards, and New Location Map Selector

### 1. Fix Build Errors

**`supabase/functions/ai-concierge/index.ts`** -- Add `: string` type annotations to the 4 `tag` parameters at lines 97, 100, 110, 111:
```typescript
.map((tag: string) => ...)
.some((tag: string) => ...)
```

**`src/components/SwipessLogo.tsx`** -- Rename `fetchpriority` to `fetchPriority` (React uses camelCase for this HTML attribute).

### 2. Tokens Modal -- Tap Outside to Close

The backdrop at line 164 already has `onClick={close}`. However the modal container at line 172 sits `inset-x-0 bottom-0 top-0` which covers the backdrop. Fix: add `pointer-events-none` to the container div, and `pointer-events-auto` only on the inner card (line 174, which already has it). This ensures tapping the area around the card triggers the backdrop close.

### 3. More Sensitive Swipe Actions

Lower swipe thresholds across the board to make swiping feel more responsive:

- **`src/lib/swipe/SwipeEngine.ts`**: `swipeThreshold: 120 -> 80`, `velocityThreshold: 400 -> 280`
- **`src/components/SimpleOwnerSwipeCard.tsx`**: `SWIPE_THRESHOLD: 65 -> 45`, `VELOCITY_THRESHOLD: 280 -> 200`
- **`src/utils/springConfigs.ts`**: `swipeThreshold: 120 -> 80`, `velocityThreshold: 400 -> 280`
- **`src/components/swipe/SwipeConstants.ts`**: `PK_DIST_THRESHOLD: 110 -> 70`, `PK_VEL_THRESHOLD: 480 -> 320`

### 4. Owner Side Cards -- Responsive for All Devices

In `src/components/swipe/OwnerAllDashboard.tsx` line 133, the card container uses hardcoded `PK_W` (340px). Replace with the same fluid sizing used on the client side:
```typescript
style={{ 
  width: 'min(90vw, 520px)',  // fills iPad, caps on desktop
  height: 'calc(100dvh - 190px)' 
}}
```

Also update `SwipeConstants.ts` `PK_W`/`PK_H` to be used only as max caps, not fixed dimensions.

### 5. Events Page Fix

The EventosFeed still falls back to `MOCK_EVENTS` when real data is empty. Audit the query and ensure it works with the live database. If no events exist yet, show an empty state instead of mock data.

### 6. New Location Radius Selector -- Map-Based

Replace the current `DistanceSlider` with a new `LocationRadiusSelector` component that features:

- A **mini interactive map** using a static map tile (Mapbox/OpenStreetMap static image centered on user's GPS location) -- no heavy map library needed
- A **circular radius overlay** that visually shows the search area on the map
- The radius slider integrated below the map
- GPS auto-detect button
- The radius circle grows/shrinks as you drag the slider
- Clean glass-morphic design matching the app's aesthetic

**Implementation approach:**
- Use a static map image from OpenStreetMap tile server (no API key needed): `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- Render a canvas/SVG circle overlay on top showing the radius
- Slider underneath controls the radius
- Works for both client and owner dashboards
- New file: `src/components/swipe/LocationRadiusSelector.tsx`
- Update both `SwipessSwipeContainer` and `ClientSwipeContainer` to use the new component
- The map updates when GPS is detected or radius changes

### Files to modify

| File | Change |
|------|--------|
| `supabase/functions/ai-concierge/index.ts` | Add `: string` type to 4 tag params |
| `src/components/SwipessLogo.tsx` | `fetchpriority` -> `fetchPriority` |
| `src/components/TokensModal.tsx` | Add `pointer-events-none` to outer container |
| `src/lib/swipe/SwipeEngine.ts` | Lower thresholds |
| `src/components/SimpleOwnerSwipeCard.tsx` | Lower thresholds |
| `src/utils/springConfigs.ts` | Lower thresholds |
| `src/components/swipe/SwipeConstants.ts` | Lower thresholds |
| `src/components/swipe/OwnerAllDashboard.tsx` | Fluid responsive width |
| `src/pages/EventosFeed.tsx` | Remove mock fallback, add empty state |
| `src/components/swipe/LocationRadiusSelector.tsx` | **New** -- Map-based radius selector |
| `src/components/swipe/DistanceSlider.tsx` | Kept as fallback, updated imports |


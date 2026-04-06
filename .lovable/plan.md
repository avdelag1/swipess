

# UI Polish & Flow Fixes

## Issues Identified

1. **Radio page not visible** — `/radio` is marked as `isFullScreen` which hides HUD correctly, but the radio page itself may have rendering/z-index issues. Need to verify `DJTurntableRadio.tsx` renders properly.

2. **Mode switcher (Client/Owner toggle) has no color distinction** — Currently uses `variant="icon"` in the TopBar which shows just User/UserCog icons with no background, no pill shape, and minimal color when inactive. Hard to see which mode you're in.

3. **Bottom nav buttons need color + pill shape for active state** — Active nav pill currently has `background: 'none'` and `boxShadow: 'none'` (lines 409-410 of BottomNavigation.tsx). No visual distinction besides icon color change.

4. **Bottom nav buttons too narrow, overlap with header content on phone** — `minWidth: 60px` and compact padding. On downloaded PWA, safe area + header height may clip content.

5. **"Two ticker" visual artifacts** — Likely the category description badge + distance slider overlapping when swipe deck is active. The top controls overlay at line 1002 has absolute positioning that can conflict with the header.

6. **Quick filter → cards first, then search/exhausted page** — Currently works: cards show when available, SwipeExhaustedState shows when deck is empty. The distance slider + search UI should appear on the exhausted state (already does). But user wants to ensure the flow is: cards first → if none, show search page with distance slider.

7. **Performance** — Look for quick wins: reduce unnecessary re-renders, heavy animations.

## Plan

### 1. Fix Mode Switcher — Pill shape with color

**File:** `src/components/ModeSwitcher.tsx`

Change the `icon` variant to a proper colored pill:
- Add a rounded-full pill background with brand color (rose for client, orange for owner)
- Make it wider (~70px) so it's clearly tappable
- Show the active mode label inside the pill (e.g. "CLIENT" or "OWNER")
- Use the existing `toggle` variant logic but simplified: a single pill that shows current mode with color

### 2. Fix Bottom Nav — Active pill with color + wider buttons

**File:** `src/components/BottomNavigation.tsx`

- Give the active nav pill a visible background: `rgba(255,107,53,0.15)` (brand orange tint) in dark mode, similar light treatment
- Increase `minWidth` from `60px` to `68px` for breathing room
- Add `2px` more padding to prevent overlap on smaller devices
- Ensure the active label text is bolder and more visible

### 3. Fix Top Controls Overlay — Prevent header overlap

**File:** `src/components/SwipessSwipeContainer.tsx`

- The category description badge at line 1030 uses `top: calc(var(--top-bar-height)+16px)` — increase to `+24px`
- The distance slider overlay at line 1002-1018 has `pt-4` — increase to `pt-8` to push below header
- Remove duplicate "two ticker" visual (the category badge + distance slider both appear at top)

### 4. Ensure Radio page renders

**File:** `src/pages/DJTurntableRadio.tsx` — Verify the component renders with proper z-index and full viewport sizing. The radio route is correctly excluded from HUD (fullscreen mode). May need to check if the lazy import resolves properly.

### 5. Quick filter flow — Cards first, search page as fallback

Already implemented correctly in `SwipessSwipeContainer.tsx` (lines 1042-1128):
- If `storeActiveCategory` is set and deck has cards → show cards
- If loading → show skeleton
- If no cards → show `SwipeExhaustedState` with distance slider

Just need to verify the exhausted state properly shows the distance/search controls. No code change needed here unless testing reveals issues.

### 6. Performance quick wins

- Remove the two large ambient glow `motion.div` elements in SwipessSwipeContainer (lines 960-993) — they animate continuously with 25-50s infinite loops, eating GPU
- Replace with a static subtle gradient background

## Files Changed

| File | Change |
|------|--------|
| `src/components/ModeSwitcher.tsx` | Pill shape with color for icon variant |
| `src/components/BottomNavigation.tsx` | Active pill background, wider buttons |
| `src/components/SwipessSwipeContainer.tsx` | Fix top overlay spacing, remove ambient glow animations |
| `src/pages/DJTurntableRadio.tsx` | Verify/fix rendering |


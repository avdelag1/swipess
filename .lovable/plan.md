

# Improve Quick Filter Swipe Cards (Client + Owner)

## Summary

Four improvements to the poker-style category swipe cards on both client and owner dashboards:

1. **Better swipe exit animation** — cards currently just fly out flat. Make them shrink/recede as if going "behind" or "into the distance" when swiped.
2. **Remove white background on bottom info section** — replace with a gradient fade/shade instead of solid `bg-white/95`.
3. **Reduce card height to fit between header and nav bar** — currently 580px, too tall for mobile viewports. Shrink to ~420px so they sit cleanly in the available space.
4. **Add pulsing swipe-hint arrows on left and right edges** — subtle, breathing chevron indicators that fade in/out to signal swipability.

---

## Technical Details

### File: `src/components/swipe/SwipeConstants.ts`
- Change `PK_H` from `580` to `420`
- Change `OWNER_PK_H` from `580` to `420`

### File: `src/components/swipe/PokerCategoryCard.tsx`

**Swipe exit animation** — replace the current `animate` call in `handleDragEnd` that just flies out to `exitX = ±700`. Instead, animate to `exitX = ±300` with simultaneous `scale → 0.7` and `opacity → 0` to create a "vanishing behind" depth effect. The exit tween should use a slightly longer duration (~0.3s) with an ease-out curve.

**Bottom info section** — replace `bg-white/95 backdrop-blur-md` on the bottom info div (line 135) with a gradient: `bg-gradient-to-t from-black/80 via-black/40 to-transparent`. Change text colors from `text-black` to `text-white` and description from `text-black/35` to `text-white/50`. The "Launch" button gets inverted styling (white bg, dark text).

**Swipe hint arrows** — add two absolutely positioned chevron icons (left and right edges, vertically centered). Each has a CSS pulsing animation: opacity cycles between 0.15 and 0.5 over ~2s, offset by 1s from each other. Use `ChevronLeft` and `ChevronRight` from lucide-react, sized ~20px, white with low opacity. Only render when `isTop` is true.

### File: `src/components/swipe/SwipeAllDashboard.tsx`
- Remove `minHeight: '700px'` or reduce to `minHeight: 'auto'`
- Change container padding from `pt-12 pb-24` to `pt-4 pb-8` so it fits within the dashboard viewport

### File: `src/components/swipe/OwnerAllDashboard.tsx`
- Same padding reduction: change `pt-8` to `pt-4`
- Reduce `minHeight: '620px'` to `minHeight: 'auto'`

### File: `src/styles/premium-polish.css`
- Update `.swipe-card-size` (the CategorySwipeStack cards) to match smaller dimensions
- Add a `@keyframes swipe-hint-pulse` animation for the breathing arrow effect

---

## Expected Results
- Cards fit cleanly between header and bottom nav without overlapping
- Swiped cards shrink and fade as if receding into distance — premium depth feel
- Bottom card info has a cinematic dark gradient instead of stark white
- Pulsing chevron arrows on card edges hint at swipe interaction


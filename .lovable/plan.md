

## Plan: Fix Card Stack Animation + Add Breathing Effect

Two issues to fix:

### Problem 1: Cards "driving fast" to position
The `CategorySwipeStack` cards use a **spring** with `stiffness: 450, damping: 35` which makes them snap aggressively into position — they overshoot and settle too fast, looking jarring. The `PokerCategoryCard` in `SwipeAllDashboard` uses `stiffness: 220, damping: 28` which is slightly better but still abrupt.

**Fix**: Slow down the settle spring on both card components to create a smooth, confident glide into position instead of a frantic snap.

### Problem 2: No breathing effect
Cards are completely static when idle. Need a very slow, subtle scale oscillation on the top card — barely perceptible but creates a sense of life.

---

### Changes

**File: `src/components/CategorySwipeStack.tsx`**
- Change the `animate` transition spring from `stiffness: 450, damping: 35, mass: 0.8` to `stiffness: 180, damping: 26, mass: 1.2` — this creates a slow, luxurious glide
- Add a subtle breathing effect to the top card: `scale` oscillates between `1.0` and `1.015` over ~4 seconds using a CSS keyframe animation (no framer-motion infinite loop to preserve performance)
- Remove `initial={false}` only for the `animate` values so cards don't teleport on mount — instead use a gentle fade-in

**File: `src/components/swipe/PokerCategoryCard.tsx`**
- Change the `animate` transition from `stiffness: 220, damping: 28, mass: 0.8` to `stiffness: 180, damping: 26, mass: 1.2` — same slow glide
- Add the same breathing CSS class to the top card wrapper
- Keep `initial={false}` to avoid mount flash, but the slower spring handles the "driving fast" feel

**File: `src/index.css`**
- Add a `@keyframes card-breathe` animation: scale from `1` to `1.015` and back over 4s with `ease-in-out`, infinite
- Add `.card-breathe` utility class that applies it

### What stays the same
- Drag physics (stiffness 800 during drag) — only the **settle** animation slows down
- Exit animations unchanged
- Image loading strategy unchanged
- Card dimensions unchanged




## Stabilization Plan: Parallax Fix, Splash Logo, General Polish

### Problems

1. **Cards shaking/vibrating** — The `useDeviceParallax` hook calls `setState` on every animation frame (~60fps), causing constant React re-renders. Combined with a 25px multiplier, even micro-movements from gyroscope noise create visible jitter.

2. **Splash/loading screen uses square logo** — `index.html` splash uses `swipess-logo-transparent.png` (the square icon), not the white wordmark (`swipess-wordmark-512.png`). The `PremiumLoader` component correctly uses the wordmark via `SwipessLogo`, but the HTML splash doesn't.

3. **Owner dashboard content overlapping bottom nav** — Already partially addressed but needs verification pass.

---

### Plan

#### 1. Fix the parallax hook to stop jitter

Rewrite `useDeviceParallax.ts` to:
- **Stop calling `setState` every frame** — instead, only update state when the delta exceeds a dead-zone threshold (~0.3px), preventing micro-jitter from gyroscope noise
- **Reduce the multiplier** from `25` to `8` (max 8px translation instead of 25px)
- **Increase damping** from `0.08` to `0.04` for a slower, smoother interpolation
- **Add a dead-zone** — ignore movements under ±2 degrees to filter sensor noise

In `SimpleOwnerSwipeCard.tsx` and `SimpleSwipeCard.tsx`:
- Reduce the parallax multiplier from `0.8` to `0.4` for a more subtle, premium feel
- The combined effect: max ~3px of smooth tilt instead of ~20px of jittery movement

In `PokerCategoryCard.tsx`:
- Already uses `0.3` multiplier — will benefit from the hook fix automatically

#### 2. Replace splash logo with the white wordmark

In `index.html`:
- Change the splash `<img>` from `swipess-logo-transparent.png` to `swipess-wordmark-512.png`
- Increase height from `2.8rem` to `3.2rem` for the wordmark proportions

In `AppOutagePage.tsx`:
- Same swap: use `swipess-wordmark-512.png` instead of `swipess-logo-transparent.png`

The `PremiumLoader` and `SwipessLogo` components already use the correct wordmark — no changes needed there.

#### 3. Verify owner dashboard layout

Quick check that the bottom padding from the previous fix (`calc(var(--bottom-nav-height) + var(--safe-bottom))`) is properly applied for immersive dashboard routes so content doesn't overlap the nav bar.

#### 4. Build verification

Run full TypeScript build check to ensure no regressions.

---

### Files to modify

| File | Change |
|------|--------|
| `src/hooks/useDeviceParallax.ts` | Add dead-zone, reduce multiplier, throttle setState |
| `src/components/SimpleOwnerSwipeCard.tsx` | Reduce parallax multiplier 0.8 → 0.4 |
| `src/components/SimpleSwipeCard.tsx` | Reduce parallax multiplier 0.8 → 0.4 |
| `index.html` | Swap splash logo to wordmark |
| `src/components/AppOutagePage.tsx` | Swap logo to wordmark |


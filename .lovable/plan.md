
## Fix: Copy Exact Swipe Card Physics to the Landing Logo

### What's Wrong Right Now

The logo has mismatched drag settings compared to the swipe cards:

| Setting | Swipe Cards (good) | Landing Logo (broken) |
|---|---|---|
| `dragElastic` | `0.9` (uniform, very free) | `{ left: 0.08, right: 1 }` (asymmetric, left feels locked) |
| `dragMomentum` | `false` (manual spring exit) | `true` (fights the `animate()` call on release) |
| `dragConstraints` | `{ left: 0, right: 0, top: 0, bottom: 0 }` | `{ left: 0, right: 0 }` (missing top/bottom) |
| Exit animation | `animate(x, exitX, { type: 'spring', stiffness: 600, damping: 30, velocity })` | `animate(x, width*1.5, { duration: 0.28, ease: [...] })` — no velocity, feels canned |
| Snap-back | `animate(x, 0, { type: 'spring', stiffness: 400, damping: 28 })` | `animate(x, 0, { type: 'spring', stiffness: 260, damping: 22 })` — too soft |

The key culprit for the "delay/freeze" feeling: **`dragMomentum={true}` combined with a tween exit animation**. When the user releases, Framer Motion first applies its own momentum deceleration, THEN the `animate()` call starts — creating that brief freeze/stutter. The swipe cards use `dragMomentum={false}` and handle everything manually, which is instant and clean.

### The Fix — One File Only

**`src/components/LegendaryLandingPage.tsx`** — update the `LandingView` component's drag settings to exactly mirror `SimpleSwipeCard.tsx`:

**Drag props:**
```tsx
drag="x"
dragConstraints={{ left: 0, right: 0 }}
dragElastic={0.9}           // ← was { left: 0.08, right: 1 }
dragMomentum={false}        // ← was true
```

**Exit animation (when swipe threshold is met):**
```tsx
animate(x, window.innerWidth * 1.5, {
  type: 'spring',
  stiffness: 600,
  damping: 30,
  velocity: info.velocity.x,    // ← uses real finger velocity, feels instant
  onComplete: () => onEnterAuth(),
});
```

**Snap-back (when threshold NOT met):**
```tsx
animate(x, 0, {
  type: 'spring',
  stiffness: 400,
  damping: 28,
  mass: 1,
});
```

**Trigger thresholds** (matching swipe cards exactly):
- `info.offset.x > 100` (was 50) — matches `SWIPE_THRESHOLD = 100`
- `info.velocity.x > 400` — matches `VELOCITY_THRESHOLD = 400`

This gives the logo the exact same "finger-glued" feeling as the swipe cards, with an instant velocity-driven exit that has zero freeze.

### Why This Works

The swipe cards feel instant because:
1. `dragElastic={0.9}` — the card follows the finger with almost no resistance in any direction
2. `dragMomentum={false}` — Framer Motion does NOT add its own momentum on release, so the `animate()` spring fires immediately with the finger's real velocity
3. Spring exit with `velocity: info.velocity.x` — the exit animation starts from the exact speed the finger was moving, so there's zero "catch up" delay

### Only 1 File Changes

- **`src/components/LegendaryLandingPage.tsx`** — update drag settings inside `LandingView` component (the motion.div wrapping the logo image)

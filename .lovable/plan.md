
## Fix: Eliminate the Breaking/Hesitation in the Landing-to-Auth Transition

### Diagnosed Root Causes

There are 3 simultaneous bugs creating the "thinks a few times then opens" feeling:

**Bug 1: Double-trigger race condition**
`onClick={handleTap}` is attached to the same `motion.div` that has `drag="x"`. Framer Motion fires `onClick` after EVERY pointer-up — including after a drag. So when the user swipes, both `handleDragEnd` AND `handleTap` fire simultaneously. The `triggered.current` ref prevents both from completing, but there is still a brief moment of conflicting animation calls before the guard kicks in.

**Bug 2: `AnimatePresence mode="wait"` creates a dead zone**
`mode="wait"` forces the landing view to fully complete its exit animation before the auth view can start entering. The exit transition is 320ms. During that window, the screen shows the landing page fading/blurring out with nothing incoming — a perceptible blank moment. The logo has already spring-animated off-screen, but the wrapper div is still playing its exit animation.

**Bug 3: Double exit animation conflict**
When the swipe threshold is met, the code does two things at once:
1. Animates the logo `x` to `window.innerWidth * 1.5` (spring, takes ~200ms to leave view)
2. After `onComplete` fires, calls `setView('auth')`, which triggers the `LandingView` wrapper's `exit` animation: `{ x: -60, filter: 'blur(6px)', duration: 0.32 }`

This means: logo flies RIGHT, then the whole page exits LEFT with blur. Two conflicting directional animations playing sequentially = the "janky" feeling.

---

### The Fix — One File: `src/components/LegendaryLandingPage.tsx`

**Fix 1: Remove `onClick={handleTap}` from the drag element**
The tap handler should only be active on a true tap (no drag movement). Use `onPointerDown` + `onPointerUp` with a movement guard instead, OR add a separate invisible tap-target element that sits on top. Simplest approach: use `whileTap` feedback only on the logo and trigger the transition only from `handleDragEnd` for swipes, keeping the tap available but protected by a distance check.

Actually the cleanest fix matching SimpleSwipeCard's pattern: **remove `onClick` entirely from the draggable div**. Add a separate `onTap` using Framer Motion's `onTap` event (which only fires when no drag occurred):

```tsx
// Framer Motion's onTap only fires if the gesture was NOT a drag
onTap={handleTap}
// Remove onClick entirely
```

**Fix 2: Change `AnimatePresence mode="wait"` to `mode="sync"`**
`mode="sync"` allows the entering view to start appearing at the same time the exiting view is leaving. This eliminates the dead zone. Both the logo flying out and the auth form fading in happen in parallel.

```tsx
// Before (creates dead zone):
<AnimatePresence mode="wait">

// After (seamless overlap):
<AnimatePresence mode="sync">
```

**Fix 3: Make the landing wrapper exit in the SAME direction as the logo**
Currently the logo exits RIGHT but the wrapper exits LEFT. Unify them:

```tsx
// Landing wrapper exit:
exit={{ opacity: 0, x: 60, filter: 'blur(4px)', transition: { duration: 0.22 } }}
// Short duration so it clears quickly, exits RIGHT (same as logo)
```

And skip the logo spring animation entirely — let the wrapper animate everything, and just call `setView('auth')` immediately when threshold is met. The wrapper's exit animation IS the visual transition:

```tsx
// When swipe threshold met:
triggered.current = true;
setView('auth'); // Fire immediately — AnimatePresence handles the visual transition
// No separate animate(x, ...) needed — the exit animation covers it
```

This is the key insight: **stop trying to manually animate the logo off-screen, then swap the view. Just swap the view — the exit animation does the work.**

**Fix 4: Align all transition timings**

Landing exit: `{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }` — fast, directional exit to right  
Auth enter: `{ duration: 0.30, ease: [0.25, 0.46, 0.45, 0.94] }` — slightly longer, smooth entrance  
Auth exit: `{ duration: 0.20, ease: [0.4, 0, 1, 1] }` — quick exit when going back  
Landing re-enter: `{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }` — gentle re-entrance from left  

---

### Summary of Changes

**`src/components/LegendaryLandingPage.tsx`**

| Location | Change |
|---|---|
| `motion.div` (logo drag element) | Replace `onClick={handleTap}` with `onTap={handleTap}` |
| `handleDragEnd` | Remove the `animate(x, ...)` spring call — replace with direct `setView('auth')` |
| `handleTap` | Remove the `animate(x, ...)` call — replace with direct `setView('auth')` |
| `LandingView` wrapper `exit` prop | Change to `exit={{ x: 80, opacity: 0, transition: { duration: 0.22 } }}` (exits RIGHT, fast) |
| `LandingView` wrapper `initial`/`animate` | Keep as-is |
| `AnimatePresence` in root | Change `mode="wait"` to `mode="sync"` |
| `AuthView` `initial`/`animate`/`exit` | Simplify: enter from right (`x: 30 → 0`), exit right (`x: 30`), no blur needed |

---

### Why This Feels Instant After the Fix

- `onTap` instead of `onClick` → no double-trigger, no race condition
- `mode="sync"` → auth starts appearing the moment landing starts exiting — zero gap
- No manual spring animation before view swap → `setView('auth')` fires in the same frame as the threshold being crossed
- Exit direction unified → everything moves the same way, the eye reads it as one fluid gesture

The result: **finger lifts → landing exits right → auth enters from right → both happening simultaneously → zero hesitation**

### Files Changed

- **`src/components/LegendaryLandingPage.tsx`** — targeted changes to `handleDragEnd`, `handleTap`, the drag `motion.div`, the `LandingView` wrapper exit, and the `AnimatePresence` mode

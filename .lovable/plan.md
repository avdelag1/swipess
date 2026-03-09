

# Performance Cleanup: Kill Hidden Performance Drains

After a deep audit, here are the remaining performance killers still active in the app. Most are background layers, blur effects, and animation loops that run continuously even when invisible.

---

## 1. Remove `AmbientSwipeBackground` entirely

**Files:** `SwipessSwipeContainer.tsx`, `TutorialSwipePage.tsx`, `AmbientSwipeBackground.tsx`

This component renders **9 animated cards** with CSS keyframe animations running continuously at z-index -1 behind the swipe deck. They load `placeholder.svg` images and animate diagonal movement forever. The cards are at **15% opacity** — barely visible, but the GPU composites 9 animated layers every frame.

**Action:** Remove all `<AmbientSwipeBackground>` usages and delete the file. The swipe card itself is the hero — no ambient background needed.

---

## 2. Remove `SwipessSPattern` from `VisualEngine`

**File:** `VisualEngine.tsx`

Renders **5 `<img>` tags** (the fire-S logo at 280px each) scattered across the background at 2.5% opacity. These are essentially invisible but force 5 image decodes and 5 compositing layers globally on every page.

**Action:** Remove the `SwipessSPattern` import and usage. Keep the base gradient and noise texture (they're cheap).

---

## 3. Remove `FireOrb` animation from Landing Page

**File:** `LegendaryLandingPage.tsx`

The `FireOrb` component creates **18 particle divs** + 4 glow layers, each with `filter: blur()` and `boxShadow`, cycling through 5 animation phases on a 7.4-second loop with multiple `setTimeout` timers. This runs continuously on the landing page.

**Action:** Replace `FireOrb` with a simple static orange dot (CSS-only glow). Same visual impact at zero CPU cost.

---

## 4. Kill remaining `backdropFilter: blur` on static UI

**Files:** `BottomNavigation.tsx`, `TopBar.tsx`, `ModeSwitcher.tsx`, `ThemeToggle.tsx`, `NotificationBar.tsx`

Each of these uses `backdropFilter: blur(24-32px) saturate(185%)` which is extremely expensive on mobile — the GPU must re-render everything behind the element every frame. The bottom nav alone uses `blur(32px)`.

**Action:** Replace `backdropFilter: blur()` with **solid semi-opaque backgrounds** (e.g., `rgba(12,12,14,0.92)` dark / `rgba(255,255,255,0.95)` light). Same visual result on dark backgrounds, massive GPU savings. Keep `transform: translateZ(0)` for compositing.

---

## 5. Remove `CheetahBackground` canvas animation

**File:** `LegendaryLandingPage.tsx`, `CheetahBackground.tsx`

Full-screen canvas running `requestAnimationFrame` at 60fps drawing hundreds of cheetah spots with gradients, breathing animations, and vignette effects. Only used when user selects "cheetah" effect mode on landing page — but the canvas runs continuously.

**Action:** Remove the cheetah mode entirely (it's a novelty effect). Simplify landing effects to just stars/orbs/off.

---

## 6. Clean `LandingBackgroundEffects` star count

**File:** `LandingBackgroundEffects.tsx`

Creates up to **1000 stars** with per-star physics calculations (velocity, damping, twinkle) every frame, plus shooting star gradient rendering with `ctx.shadowBlur`.

**Action:** Cap stars at **300** (from 1000). Remove `ctx.shadowBlur` from shooting stars (expensive per-draw). Lower the density divisor from `/600` to `/1800`.

---

## 7. Remove `willChange` abuse

**Multiple files** (27 files, 175 matches)

`willChange: 'transform'` is applied to dozens of elements that don't animate. This forces the browser to create separate compositing layers for each one, wasting GPU memory. Only elements that are actively animating should have `willChange`.

**Action:** Remove `willChange` from all static elements. Keep only on: draggable swipe card, AnimatedOutlet wrapper, and BottomNavigation (scroll hide/show).

---

## Summary of Impact

| Drain | GPU Layers Saved | CPU Saved |
|-------|-----------------|-----------|
| AmbientSwipeBackground | 9 animated layers | CSS animation loop |
| SwipessSPattern | 5 image layers | 5 image decodes |
| FireOrb | 22 layers + blur | setTimeout loop + blur |
| backdropFilter blur (5 components) | 5 blur composites/frame | GPU blur shader |
| CheetahBackground | 1 canvas | rAF loop + 100s of draws |
| Star count reduction | — | 700 fewer physics calcs/frame |
| willChange cleanup | ~20 unnecessary layers | GPU memory |

**Expected result:** Significantly snappier navigation, smoother swiping, lower battery drain, faster PWA startup.


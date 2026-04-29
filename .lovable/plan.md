# Three-Part Fix Plan

## 1. Healing bowl tap sounds on landing page (pre-auth)

**Problem:** `LegendaryLandingPage.tsx` calls `triggerHaptic(...)` on every tap but never plays an audio bowl. Sound assets exist in `public/sounds/` (e.g. `singing-bowl-gong-69238.mp3`, `bell-meditation-75335.mp3`, the chakra series).

**Fix:**
- Create a small util `src/utils/landingSounds.ts` that exposes `playLandingTap()`:
  - Pre-loads a pool of 3–4 calming bowl sounds (singing bowl, meditation bell, sacral chakra, tuning fork).
  - Picks one randomly per tap so it doesn't get repetitive.
  - Volume capped at ~0.35, fully fail-silent on autoplay block.
  - Uses a single shared `AudioContext`-free `<audio>` element pool to avoid GC stutter.
- In `LegendaryLandingPage.tsx`, wrap the existing `triggerHaptic('medium'/'light')` calls on the main CTA buttons (Login, Sign up, Apple, Google, tab toggles) with `playLandingTap()`. Only on the landing surface — not after auth.
- Trigger a one-time `unlock()` on first user interaction (most browsers require a gesture before audio works).

## 2. Quick-filter swipe cards: stop the shaking & flickering

**Problem (in `PokerCategoryCard.tsx`):**
- `<motion.img>` uses inline `style={{ transform: isTop && isDragging ? 'scale(1.05)' : 'scale(1)' }}` which **fights** the parent `motion.div`'s drag transform → causes per-frame layout reflow → visible shake.
- Card animates `y`, `opacity`, `scale` AND the parent has `willChange: 'transform, opacity'`, but the photo `<img>` re-renders `transform` on every drag tick.
- `useEffect` re-creates a new `Image()` on every photo change which can flash `imgReady=false` → flicker on re-cycle.
- Stack `filter: blur()` recomputes on each render of background cards → jitter.

**Fix:**
- Move photo zoom to a **CSS class toggle** (`data-dragging="true"` + CSS transition) instead of inline style swap, so the browser keeps it on the compositor layer.
- Replace the photo zoom with a `useTransform(x, ...)` driven scale on the image itself (compositor-only, no re-renders).
- Use the shared `imageCache` (`src/lib/swipe/imageCache.ts` / `cardImageCache.ts`) so `imgReady` stays `true` after first load and doesn't flicker on cycle.
- Pre-rasterize the blurred background cards: compute `filter` once via `useMemo(..., [index])` and apply via `style` only when index changes.
- Add `transform: translateZ(0)` and `backface-visibility: hidden` on the card root to force GPU layer (prevents subpixel jitter on iOS Safari).
- Soften spring slightly: `PK_SPRING` stiffness 400 → 320, damping 30 → 28 — feels smoother without losing snap.

## 3. Owner side: actually see the real swipe cards (listings + clients)

**Problem:** `EnhancedOwnerDashboard.tsx` forces this 3-phase flow: `cards` (poker quick-filter fan) → `kilometer` (radius slider) → `swipe` (real ClientSwipeContainer). The user can't jump past the quick filter to test the real deck.

**Fix:**
- Add a **"Skip to Swipe Deck"** secondary button on the kilometer page (next to "Initiate Scan") that goes straight to `swipe` phase using a sensible default radius (50 km) and category (`all-clients` if none picked).
- Add a small persistent **"Show Swipe Deck"** quick-action chip in the top-right of the `cards` (poker) phase header. One tap → set `activeCategory = 'all-clients'`, `ownerPhase = 'swipe'`, bypassing kilometer.
- Also add a separate mode for **listings** (currently owner only sees client profiles via `useSmartClientMatching`). Add a toggle on the swipe phase header: `Clients ⇆ Listings`. When in Listings mode, render the `SwipessSwipeContainer` (same one client side uses) so owner can preview/test the real listing deck their clients will see.
- Persist the last-used owner mode (clients vs listings) in localStorage so testing is sticky.

## Files to touch

```text
src/utils/landingSounds.ts                       (new)
src/components/LegendaryLandingPage.tsx          (wire playLandingTap into tap handlers)
src/components/swipe/PokerCategoryCard.tsx       (compositor zoom, GPU layer, cached img)
src/components/swipe/SwipeConstants.ts           (soften PK_SPRING)
src/pages/EnhancedOwnerDashboard.tsx             (skip-to-swipe chip, clients/listings toggle)
```

## Out of scope

- No backend / RLS changes.
- No changes to swipe physics for the **real** ClientSwipeContainer (only the poker quick-filter cards).
- No new audio assets — only uses the existing `public/sounds/*` library.

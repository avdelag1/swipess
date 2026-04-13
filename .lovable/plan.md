

# Plan: Fix Nav Button Responsiveness + Redesign Resident Card as Full Page

## Problem 1: Navigation buttons feel slow to respond
The bottom nav buttons use `framer-motion` `whileTap` which waits for React's render cycle before showing visual feedback. The `useInstantReactivity` hook already provides 0ms feedback via CSS class injection on `pointerdown`, but the nav buttons have `touch-manipulation` which may conflict, and the motion spring animation adds perceived latency.

**Fix:**
- Add native CSS `:active` scale transform on nav buttons (40ms transition) so feedback is instant without waiting for framer-motion
- Keep `whileTap` as a secondary enhancement but make the CSS `:active` the primary visual feedback
- Ensure `touch-manipulation` doesn't suppress the instant reactivity hook
- Add `data-instant-feedback` attribute so the global hook can apply even faster transforms

## Problem 2: Resident Card is a modal with glassmorphism — user wants a full page
Currently `VapIdCardModal` is a modal overlay with `backdrop-blur-md`, glass effects, and radial gradient overlays. User wants:
- A proper **full page** (route-based), not a modal
- No glassmorphism / blur backgrounds
- Editable/updatable card fields
- Clean, solid background

**Changes:**

### File: `src/styles/pwa-performance.css`
- Add CSS rule for nav buttons: `.app-bottom-bar button { transition: transform 40ms ease; }` and `.app-bottom-bar button:active { transform: scale(0.92); }`

### File: `src/components/BottomNavigation.tsx`
- Remove `whileTap` from motion.button (CSS handles it now, faster)
- Or change motion.button to regular `<button>` with the CSS active state for maximum speed

### File: `src/components/VapIdCardModal.tsx` → Redesign
- Remove the backdrop blur overlay (`backdrop-blur-md`)
- Remove radial gradient overlay div at bottom
- Remove the `bg-black/70 backdrop-blur-md` backdrop
- Change from modal pattern to a full-screen page layout:
  - Remove `AnimatePresence` modal wrapper
  - Make it a full-screen `fixed inset-0` panel with solid `bg-background`
  - Simple slide-up animation (no scale)
  - Solid background, no glass effects
- Keep all the existing edit functionality (bio editing, document upload, QR code, detail items)
- Keep the sticky header with close button
- Remove the decorative radial gradient overlay at the bottom of the card

### File: Navigation updates
- Update all places that open `VapIdCardModal` to continue working (it stays as a component, just restyled as a full-page panel rather than a floating modal)

## Summary of changes
1. **3 files modified**: `pwa-performance.css`, `BottomNavigation.tsx`, `VapIdCardModal.tsx`
2. Nav buttons get instant CSS `:active` feedback (40ms vs ~100ms+ with framer-motion)
3. Resident card becomes a clean full-page panel with solid background, no blur/glass effects


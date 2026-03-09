

# Round 5: Dead Components, Dead CSS, and Remaining Performance Drains

After a full audit of the codebase post-cleanup, here is what remains.

---

## 1. Delete Dead Components (unused, zero imports)

| File | Lines | Why Dead |
|------|-------|----------|
| `src/components/LiveHDBackground.tsx` | 227 | Commented out in `DashboardLayout.tsx`, never imported elsewhere. Has 3x `filter: blur(40-50px)` + `willChange` + CSS animation loop. |
| `src/components/SwipessSWatermark.tsx` | ? | Zero imports anywhere in the codebase. |
| `src/pages/RadioPlayer.tsx` | 394 | Zero imports. `RetroRadioStation.tsx` is the actual radio page used in routes. |
| `src/components/StarFieldBackground.tsx` | 7 | Already renders `null`. Imported once but does nothing. Remove the file and the import from `LegendaryLandingPage.tsx`. |

**Action:** Delete all 4 files. Remove the commented-out import in `DashboardLayout.tsx` and the `StarFieldBackground` import + usage in `LegendaryLandingPage.tsx`.

---

## 2. Purge Dead CSS from `premium-polish.css` (~180 lines)

The following CSS classes are defined but **never used in any component**:

- `.glass-enhanced`, `.glass-level-1/2/3`, `.glass-dual-border` (lines 10-40) -- 0 usages
- `.button-premium` (line 47) -- 0 usages  
- `.ambient-orb` (line 245) -- 0 usages
- `.gpu-accelerated` (line 429) -- 0 usages (only in comments)
- `.space-xs` through `.space-4xl` and `.p-xs` through `.p-4xl` (lines 456-519) -- 0 usages (Tailwind handles all spacing)
- `.text-display-premium` (line 264) -- 0 usages
- `.shadow-soft-sm/md` (lines 439-444) -- 0 usages (only `shadow-soft-lg` used via CSS variable)

**Action:** Remove all dead class blocks. Keep only classes actively referenced: `modal-liquid-glass`, `liquid-glass-highlight--animated`, `radio-slider`, `radio-dial`, `animate-spin-slow`, and the `@media` reduced-motion block.

---

## 3. Replace Remaining `modal-liquid-glass` Blur

The `.modal-liquid-glass` class in `premium-polish.css` still uses `backdrop-filter: blur(40px) saturate(200%)` (lines 842-843). This is applied to modal dialogs.

**Action:** Replace with solid semi-opaque background. Modals are already nearly opaque (0.88-0.92 opacity), so blur adds nothing visible but costs a full-frame GPU shader.

---

## 4. Clean Framer Motion `filter: blur()` Transition Animations

Multiple components use `filter: 'blur(8px)'` as an initial/exit state in framer-motion variants. These are **transition blurs** (they animate from blur to no-blur), not persistent. They fire once on mount then clear.

**Assessment:** These are acceptable -- they run briefly during page transitions and don't persist. However, the `ImageCarousel.tsx` blur layer (line 346: `filter: 'blur(20px)'` on a full image) is **persistent** and re-composites every frame during swipe.

**Action:** Remove the blurred background image layer from `ImageCarousel.tsx` (the "enhanced placeholder" at line 340-356). The actual image renders on top of it, making it invisible anyway.

---

## 5. Clean Commented-Out Code

- `App.tsx` line 33-34: Dead comment about `DepthParallaxBackground`
- `DashboardLayout.tsx` line 19-20: Dead commented import of `LiveHDBackground`

**Action:** Remove dead comments.

---

## Summary

| Target | Impact |
|--------|--------|
| Delete 4 dead files (~628 lines) | Bundle size reduction |
| Purge ~180 lines dead CSS | Smaller stylesheet, fewer parsed rules |
| Replace `modal-liquid-glass` blur | GPU shader savings on every modal open |
| Remove ImageCarousel blur layer | GPU compositing savings during swipe |
| Clean dead comments | Code hygiene |

**Total:** ~800 lines of dead code removed. No visual or functional changes -- everything deleted is either unused or invisible.




# Round 4: CSS Bloat, Dead Styles, and Last Blur Killers

The codebase has accumulated massive amounts of unused CSS and several remaining blur effects that are still hurting performance.

---

## 1. Kill `filter: blur(8px)` on Header/Nav Hide

**File:** `src/index.css` (lines 118, 134, 184, 188)

The `.app-header.header-hidden` uses `filter: blur(8px)` for a "cinematic dissolve" effect. This triggers a full-frame GPU blur shader every time the user scrolls. The header also has `will-change: transform, opacity, filter` permanently reserving GPU memory for filter transitions.

**Action:** Remove `filter: blur(8px)` from `.header-hidden`. Replace with pure `opacity: 0` + `translateY(-100%)`. Remove `filter` from `will-change` and transition declarations on both `.app-header` and `.app-bottom-bar`.

---

## 2. Remove Remaining `backdropFilter: blur()` in Components

**Still active blurs found:**

| File | Count | Context |
|------|-------|---------|
| `TutorialSwipePage.tsx` line 713 | 1 | `backdropFilter: 'blur(16px)'` on a button |
| `ClientProfileNew.tsx` line 143 | 1 | `backdropFilter: 'blur(12px)'` on profile completion card |
| `RetroRadioStation.tsx` | 5 | `backdropFilter: 'blur(12px)'` on radio controls |

**Action:** Replace all with solid semi-opaque backgrounds.

---

## 3. Remove `LiquidGlassSurface` Component (326 lines, UNUSED)

**File:** `src/components/ui/LiquidGlassSurface.tsx`

This 326-line component with `backdropFilter: blur() saturate()`, framer-motion springs, and pointer-tracking animations is **imported by zero components**. Pure dead code adding to bundle size.

**Action:** Delete the file.

---

## 4. Purge Dead CSS from `index.css` (~600 lines of unused styles)

**File:** `src/index.css` (2714 lines total)

The following CSS class blocks are defined but **never referenced in any TSX file:**

- `.swipe-action-btn` and all variants (~120 lines, 2101-2220)
- `.swipe-overlay-container` and overlay styles (~50 lines, 2270-2320)
- `.swipe-card-premium`, `.swipe-card-glow` (~40 lines, 2388-2411)
- `.gpu-accelerate`, `.gpu-accelerated`, `.fast-touch`, `.fast-card` (~30 lines)
- `.glass-effect`, `.glass-dark`, `.blur-on-scroll` (~40 lines, 1082-1150)
- `.dynamic-card` (~20 lines, 967-980)
- Broad wildcard selectors like `[class*="card"]` with `will-change: transform, opacity` (line 1234-1241) — forces GPU layers on EVERY element whose class contains "card"

**Action:** Remove all unused CSS blocks. This eliminates ~600 lines of dead CSS and removes the wildcard `will-change` selector that promotes dozens of unnecessary GPU layers.

---

## 5. Clean `pwa-performance.css` Dead Rules

**File:** `src/styles/pwa-performance.css`

Contains rules for `.swipe-action-btn`, `.swipe-btn-insights`, `.swipe-btn-heart`, `.swipe-btn-dislike`, `.swipe-btn-share` — none of these CSS classes exist in any component. Also has overly aggressive global rules like `* { touch-action: manipulation }` that can interfere with scroll and native gestures.

**Action:** Remove references to dead classes. Keep only the PWA-mode specific rules that are actually used.

---

## 6. Trim `PremiumShine.css` Blur

**File:** `src/styles/PremiumShine.css`

The `.premium-card-lux` class uses `backdrop-filter: blur(12px)` — used only in `MessageActivationPackages.tsx` (a modal dialog, not a swiped/dragged element).

**Action:** Replace with solid background. Low priority since it's only active when the packages modal is open.

---

## Summary

| Target | Lines Saved | Impact |
|--------|-------------|--------|
| Header/nav `filter: blur` removal | ~10 | GPU shader on every scroll |
| 3 component blur fixes | 7 blurs | GPU compositing |
| Delete `LiquidGlassSurface.tsx` | 326 lines | Bundle size + dead blur |
| Dead CSS in `index.css` | ~600 lines | Bundle + wildcard GPU layers |
| Dead CSS in `pwa-performance.css` | ~30 lines | Clean code |
| PremiumShine blur fix | ~2 lines | Modal GPU shader |

**Total:** ~960 lines of dead/harmful code removed. The wildcard `[class*="card"]` will-change rule alone is likely creating 10-20 unnecessary GPU layers across the app.


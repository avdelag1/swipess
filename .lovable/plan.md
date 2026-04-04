

# Clean Up Visual Noise + Smoother Theme Toggle + PWA Install

## Problems Found

1. **Theme transition flash**: The CSS `theme-ripple-reveal` animation applies `filter: brightness(1.2) contrast(1.1)` at frame 0, creating a visible white/bright flash during the clip-path expansion. Combined with `startViewTransition`, this causes the jarring black-to-white burst.

2. **Header lines/shades**: The TopBar has a gradient overlay div (lines 187-199) extending to `height: 160%` with visible opacity stops. On top of that, `AppLayout` renders `GradientMaskTop`, `GradientMaskBottom`, AND `GlobalVignette` -- three separate fixed gradient layers. That's 4 gradient overlays stacking, creating visible "lines" where opacity bands intersect.

3. **Too many cinematic layers**: The vignette + top mask + bottom mask + header gradient = visual noise on a simple card-based UI. The floating buttons already have their own shadows; they don't need 4 gradient layers behind them.

4. **PWA is already configured** -- manifest.json, service worker, and icons all exist. The app is already installable from the browser. No additional setup needed.

---

## Changes

### 1. Simplify Theme Transition (no flash)
**File: `src/index.css`**
- Remove `filter: brightness(1.2) contrast(1.1)` from the `theme-ripple-reveal` keyframe at 0%
- Remove `transform: scale(0.995)` / `scale(1)` (unnecessary micro-scale causes compositing work)
- Keep the clip-path reveal but make it a clean opacity-only transition:
```css
@keyframes theme-ripple-reveal {
  0% { clip-path: circle(0% at var(--theme-reveal-x, 50%) var(--theme-reveal-y, 50%)); }
  100% { clip-path: circle(150% at var(--theme-reveal-x, 50%) var(--theme-reveal-y, 50%)); }
}
```

### 2. Remove Cinematic Gradient Layers from AppLayout
**File: `src/components/AppLayout.tsx`**
- Remove the entire `GradientMaskTop`, `GradientMaskBottom`, and `GlobalVignette` block (lines 53-62). The floating buttons already have their own shadows -- these 3 fixed gradient overlays just add visual noise and the "line" artifacts the user sees.
- Remove the imports for these components.

### 3. Simplify TopBar Header Gradient  
**File: `src/components/TopBar.tsx`**
- Remove the "ATMOSPHERIC GRADIENT" div (lines 186-199). It creates a visible haze/line behind the header. The buttons are floating with shadows already -- they don't need a 160%-height gradient behind them.
- The header becomes fully transparent, buttons float naturally over the content.

### 4. PWA Install Info
The app already has a complete PWA setup (manifest.json, service worker, icons). Users can install it to their phone's home screen right now:
- **iPhone**: Safari → Share button → "Add to Home Screen"  
- **Android**: Chrome menu → "Install app" or "Add to Home Screen"

Once installed, it runs fullscreen like a native app.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Remove brightness/contrast/scale from theme-ripple-reveal |
| `src/components/AppLayout.tsx` | Remove GradientMaskTop, GradientMaskBottom, GlobalVignette |
| `src/components/TopBar.tsx` | Remove atmospheric gradient div |


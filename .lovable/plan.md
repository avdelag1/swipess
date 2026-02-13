

## Live Sunset-Night-Sunrise Cycle Background

Replace the empty `StarFieldBackground` component with a full cinematic day/night cycle that plays continuously on the landing page. The effect will be entirely CSS-driven (no canvas, no heavy libraries) for smooth 60fps performance.

### Visual Cycle (120 seconds total loop)

```text
Phase 1: SUNSET (0-30s)
  - Sky gradient shifts from warm orange/pink to deep purple/red
  - Sun (circle element) slowly descends from mid-screen toward the horizon
  - Ocean reflects warm sunset colors with gentle wave shimmer
  - Clouds tinted in golden/pink hues

Phase 2: NIGHT (30-70s)
  - Sky transitions to deep dark blue/black
  - Sun disappears below horizon
  - Stars fade in (scattered dot elements with twinkle animation)
  - Moon appears with soft glow
  - Ocean darkens, reflects moonlight with subtle silver shimmer

Phase 3: SUNRISE (70-100s)
  - Sky lightens from dark to soft pink/coral/gold
  - Stars fade out
  - Sun rises from the horizon, glowing warmly
  - Ocean reflects sunrise colors
  - Fresh morning light wash

Phase 4: TRANSITION BACK (100-120s)
  - Smoothly blend back to sunset position to restart the loop seamlessly
```

### Architecture

Only **one file** needs to be created/modified:

1. **`src/components/StarFieldBackground.tsx`** - Replace the empty component with the full scene. This component is already imported and rendered in `LegendaryLandingPage.tsx`, so no other files need changes.

### Technical Approach

- **Sun/Moon**: Absolutely positioned `div` elements with `border-radius: 50%` and radial gradients, animated along a vertical path using CSS `@keyframes`
- **Sky**: Multiple layered gradient backgrounds that shift colors through the cycle using a single long CSS animation
- **Ocean**: Bottom 30% of the screen with a separate gradient that mirrors the sky colors, plus a subtle wave effect using an SVG wave path with CSS animation
- **Stars**: 40-50 small absolutely positioned dots that fade in/out with random twinkle delays, only visible during the night phase
- **Waves**: 2-3 SVG wave shapes at the bottom with gentle horizontal translate animation for realistic water movement
- **All animations**: Pure CSS `@keyframes` with `will-change: transform, opacity` for GPU acceleration
- **Reduced motion**: Falls back to a static sunset scene
- **z-index**: Stays at z-index 0-5, below the main content at z-index 20

### Performance

- Zero JavaScript animation loops (all CSS)
- No canvas or WebGL
- GPU-accelerated transforms only
- Respects `prefers-reduced-motion`
- Disabled on devices with fewer than 4 CPU cores
- Non-interactive (`pointer-events: none`)

### Files to Modify

1. `src/components/StarFieldBackground.tsx` - Complete rewrite with the sunset/night/sunrise cycle scene


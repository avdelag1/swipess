

# Ultra-Speed Performance + Premium Logo Upgrade

## What You'll Get
A noticeably faster app — snappier than Instagram — with a bigger, bolder, more premium SwipesS logo on the landing page that carries its improved style across the entire app.

---

## Part 1: Logo Redesign — Bigger, Bolder, Rounded, Glowing

### SwipessLogo Component (`src/components/SwipessLogo.tsx`)
- Increase all font sizes by ~1 step (e.g. `2xl` goes from `text-5xl` to `text-6xl`, `4xl` from `text-7xl` to `text-8xl`)
- Switch from `font-black` to `font-[900]` with slightly wider tracking for a thicker feel
- Add a soft ambient glow layer behind the text using a `box-shadow`-style radial gradient with warm white tones
- Add subtle `border-radius`-like softness via a rounded container with padding

### Landing Page Logo (`src/components/LegendaryLandingPage.tsx`)
- Bump the hero wordmark from `text-7xl` to `text-8xl` / `text-[8rem]` on desktop
- Increase the glow intensity — stronger `text-shadow` with a warm white outer bloom
- Add a subtle frosted glass pill behind the wordmark for depth (rounded-3xl, bg-white/5, border-white/10)
- Ensure the `LogoImage` component uses the new larger `3xl` size

### Splash Screen (`index.html`)
- Increase `.splash-wordmark` font-size from `3rem` to `4.5rem`
- Match the updated glow/shadow treatment from the React component
- Add `border-radius` wrapper styling for consistency

### Propagate to Other Logo Instances
- `PageHeader.tsx`, `TopBar.tsx`, settings pages — these use `size="xs"` or `size="md"` and will automatically benefit from the component-level upgrade without individual changes

---

## Part 2: Performance — Faster Than Instagram

### A. Kill CSS Performance Killers

**`src/index.css`**
- Remove the universal `* { backface-visibility: hidden }` rule — this forces GPU layer promotion on EVERY element, creating massive memory pressure
- Replace with targeted `.gpu-accelerate` class only where needed (swipe cards, page transitions)
- Remove universal `scrollbar-width: none !important` from `*` selector — move to `html, body` only (the `*` selector triggers style recalc on every DOM mutation)

**`src/App.css`**
- Remove entirely or gut it — it's leftover Vite boilerplate (`logo-spin`, `.card`, `.read-the-docs`) that adds dead CSS to every page load

### B. Reduce Provider Nesting Overhead

**`src/providers/RootProviders.tsx`**
- Delay `RadioProvider` mounting until user navigates to a radio route (lazy provider pattern)
- Move `ResponsiveProvider` to only wrap routes that need it, or make it a lightweight CSS-only solution
- `AppLifecycleManager` already delays 3s — reduce to 1.5s since hooks are lightweight

### C. Tighten Navigation Transitions

**`src/components/AnimatedOutlet.tsx`**
- Reduce entry duration from `0.1s` to `0.06s` (60ms — below human perception threshold)
- Reduce exit from `0.08s` to `0.04s`
- Remove `willChange: 'opacity'` from style (let browser decide — permanent `will-change` wastes GPU memory)

**`src/components/AnimatedPage.tsx`**
- Match the same 60ms/40ms timing
- Remove `willChange: 'opacity, transform'` inline style

### D. Eliminate Unnecessary GPU Layers

**`src/styles/pwa-performance.css`**
- Audit and remove redundant `will-change` declarations on `.app-bottom-bar`, `.tinder-nav-scroll > button`
- Replace permanent `will-change: transform` with `transform: translateZ(0)` only on actively animated elements

### E. Faster Splash Dismissal

**`index.html`**
- Reduce splash dissolve from `0.35s` to `0.2s`
- Reduce removal timeout from `600ms` to `300ms`
- Reduce fallback timeout from `5000ms` to `3500ms`
- Reduce `#root` opacity transition from `0.35s` to `0.15s`

### F. Defer Heavy Landing Page Effects

**`src/components/LegendaryLandingPage.tsx`**
- The `LandingBackgroundEffects` canvas (548 lines of star/sunset rendering) is already lazy — ensure it only mounts after a 500ms delay via `useEffect` timer, not on first paint
- Remove the `filter: 'blur(10px)'` from the landing `initial` animation — blur is extremely expensive on mobile GPUs

### G. Image Prefetch Trimming

**`src/components/ZenithPrewarmer.tsx`**
- Remove `/icons/icon-512.png` prefetch (512px icon is never shown in-app)
- Remove `/placeholder.svg` prefetch (rarely used, wastes bandwidth)
- Keep only `/icons/icon-192.png` if needed

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/SwipessLogo.tsx` | Bigger sizes, thicker font, glow upgrade, rounded container |
| `src/components/LegendaryLandingPage.tsx` | Larger hero wordmark, frosted pill, remove blur animation |
| `index.html` | Bigger splash wordmark, faster dissolve timings |
| `src/index.css` | Remove universal `*` performance killers |
| `src/App.css` | Delete dead Vite boilerplate CSS |
| `src/components/AnimatedOutlet.tsx` | 60ms/40ms transitions, remove will-change |
| `src/components/AnimatedPage.tsx` | Match faster timings |
| `src/providers/RootProviders.tsx` | Lazy RadioProvider, faster lifecycle |
| `src/styles/pwa-performance.css` | Clean up will-change declarations |
| `src/components/ZenithPrewarmer.tsx` | Trim unnecessary prefetches |


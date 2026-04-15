

## Performance Optimization Plan -- Target 90+ Lighthouse Score

This plan addresses the specific Lighthouse issues: 6.2s LCP, unused JS/CSS, render-blocking resources, cache policy, and animation jank.

---

### 1. Fix LCP (6.2s target: under 2.5s)

**Problem**: The largest contentful paint is delayed by render-blocking font loading and lazy-loaded dashboard chunks.

**Changes**:
- **`index.html`**: Switch body font from Google Fonts `Inter` to system font stack (`-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif`). Remove the Google Fonts `<link rel="preload">` and `<noscript>` fallback entirely. Keep `Outfit` only if used for branding (headings); if so, load it via `font-display: optional` to prevent any layout shift.
- **`index.html`**: Add `fetchpriority="high"` to the splash wordmark image (already present -- verify it propagates).
- **`src/index.css`**: Update `font-family` references from `'Inter'` to the system stack.
- **`tailwind.config.ts`**: Update `fontFamily.sans` to system stack.

**Why**: System fonts eliminate the ~300-500ms font download + FOIT/FOUT cycle that directly inflates LCP.

---

### 2. Remove Unused JavaScript (~255 KiB)

**Problem**: Multiple heavy libraries are bundled but rarely used on first load.

**Changes**:
- **`src/App.tsx`**: The `SpeedOfLightPreloader` is imported statically. Make it lazy or move into `ZenithPrewarmer` (it's redundant since `ZenithPrewarmer` already prefetches role routes).
- **`src/App.tsx`**: Remove the top-level `import('@/i18n')` eager call. Defer i18n initialization to after first paint inside `AppLifecycleManager` (the 500ms delayed hook loader).
- **`vite.config.ts`**: Add `lottie` and `recharts`/`victory` to the `optimizeDeps.exclude` list so they tree-shake properly if unused on the critical path.
- **`src/providers/RootProviders.tsx`**: The `LazyMotion features={domMax}` import pulls in the full framer-motion feature set. Switch to `domAnimation` (smaller) and only load `domMax` lazily when drag/layout features are actually needed (swipe deck pages).

---

### 3. Remove Unused CSS (~43 KiB)

**Changes**:
- **`src/styles/pwa-performance.css`**: Audit and trim rules that target elements no longer in the DOM (e.g., Sonner toast overrides -- the project uses `NotificationBar`, not Sonner).
- **`src/styles/premium-polish.css`**: Audit for dead selectors. Remove any rules targeting `.red-matte` leftover from the sunset filter removal.
- **`src/styles/matte-themes.css`**: Clean up any remaining sunset/red-matte animation keyframes if they survived the earlier removal.

---

### 4. Eliminate Render-Blocking Resources

**Changes**:
- **`index.html`**: The inline `<script>` block (connection warmup + passive touch patching) is synchronous and blocks parsing. Wrap the `EventTarget.prototype.addEventListener` override in a `requestIdleCallback` or move it to `src/main.tsx` post-render. Keep only the theme-setting logic inline (3 lines).
- **`index.html`**: The `manifest.json` link and favicon links are fine but ensure no additional synchronous scripts are added.

---

### 5. Static Asset Cache Policy (1-year)

**Problem**: Lighthouse flags missing long-term cache headers on icons/logos.

**Changes**:
- **`public/_headers`** (new file, for Netlify/Vercel): Add cache headers for static assets:
  ```
  /assets/*
    Cache-Control: public, max-age=31536000, immutable

  /icons/*
    Cache-Control: public, max-age=31536000, immutable

  /favicon.png
    Cache-Control: public, max-age=31536000, immutable
  ```
- **`vercel.json`** (new file if deploying on Vercel): Add equivalent `headers` config for `/assets/**` and `/icons/**`.
- The service worker already handles immutable caching for hashed assets (good).

---

### 6. GPU-Accelerated Animations Only

**Problem**: The staggered entrance animations on the swipe deck page may use `top`/`left`/`height` which cause layout thrashing.

**Changes**:
- **`src/pages/ClientDashboard.tsx`** and **`src/components/EnhancedOwnerDashboard.tsx`**: Verify the `motion.div` entrance uses only `opacity`, `transform` (translate/scale). The current `y: 30` maps to `translateY` via framer-motion (good). Add `will-change: transform, opacity` to the container.
- **`src/components/swipe/DistanceSlider.tsx`**: The `scaleX` track animation uses `transformOrigin` (good, GPU path). Confirm no `width`/`height` animations. Add `will-change: transform` to the animated track element.

---

### 7. Optimistic UI for Distance/Filter Page

**Problem**: The filter page waits for data before showing the UI.

**Changes**:
- **`src/components/swipe/DistanceSlider.tsx`**: Already uses local state (`localKm`) with debounced parent updates -- this is correct optimistic UI.
- **`src/pages/ClientDashboard.tsx`**: The `AnimatePresence mode="wait"` means the old view must fully exit before the new one enters. Change to `mode="popLayout"` or remove `mode` to allow overlap, making the transition feel instant.

---

### Summary of Files

| File | Action |
|------|--------|
| `index.html` | Remove Google Fonts, use system fonts, trim inline script |
| `src/index.css` | Update font-family to system stack |
| `tailwind.config.ts` | Update `fontFamily.sans` |
| `src/App.tsx` | Remove redundant `SpeedOfLightPreloader`, defer i18n |
| `src/providers/RootProviders.tsx` | Switch `domMax` to `domAnimation` |
| `src/styles/pwa-performance.css` | Remove dead Sonner/toast rules |
| `src/styles/matte-themes.css` | Clean leftover sunset keyframes |
| `src/styles/premium-polish.css` | Audit dead selectors |
| `src/pages/ClientDashboard.tsx` | Change AnimatePresence mode, add will-change |
| `src/components/EnhancedOwnerDashboard.tsx` | Add will-change to entrance animation |
| `src/components/swipe/DistanceSlider.tsx` | Add will-change to track |
| `public/_headers` | New -- long-term cache policy |


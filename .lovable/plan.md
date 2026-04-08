

## Plan: Performance Optimization — Push Lighthouse Score Higher

### Analysis of Lighthouse Issues

From the audit, here's what's actionable vs. not:

| Issue | Actionable? | Impact |
|-------|------------|--------|
| Logo image oversized (60 KiB) | Yes — resize + convert to WebP | Fixes LCP + image delivery |
| Unused CSS (43 KiB) | Partially — Tailwind purge already active, but 96% of CSS unused on landing | Medium |
| Unused JS (297 KiB) | Yes — vendor-core ships too much upfront | High |
| LCP 4.9s | Yes — direct result of oversized logo image being the LCP element | High |
| Unused preconnect (images.unsplash.com) | Yes — remove it from `<head>` | Minor |
| Cache lifetimes (556 KiB) | No — server/CDN config, not code-level | N/A |
| Minify JS (7 KiB lucide-react) | Minor — already using esbuild minify | Low |

### Changes

**1. Fix LCP: Optimize the brand logo image (biggest win)**

The splash screen logo (`swipess-brand-logo.jpg`) is 1312x784px / 62KB but displays at 164x98px. This is the LCP element.

- Resize to 400x240px (2x retina for the 200px display width)
- Convert to WebP (will drop from 62KB to ~5-8KB)
- Create a tiny splash-specific version for `index.html`
- Keep original for OG/social sharing if needed
- Update `SwipessLogo.tsx` and `index.html` to use the optimized version

**2. Remove unused preconnect hints**

Lighthouse flags `images.unsplash.com` preconnect as unused on the landing page. Remove it — the app will still connect when images are actually needed on dashboard pages.

**3. Reduce unused JS: Move i18n out of the critical path**

`i18next` (13KB) + `react-i18next` are in vendor-core but only needed after auth. Already lazy-loading translations, but the i18n initialization itself (`import '@/i18n'` in `App.tsx`) forces it into the entry bundle.

- Move `i18n` initialization to a deferred import inside App component (after mount)

**4. Reduce unused JS: Lazy-load react-hook-form and zod**

`react-hook-form` (8KB wasted) and `zod` (12KB wasted) are in vendor-core. These are only needed on form pages (profile, settings, listings).

- Move them to a separate manual chunk `vendor-forms` in vite config so they don't ship with the entry bundle

**5. Reduce unused CSS: Purge splash styles after hydration**

The inline splash styles in `index.html` (heartbeat keyframes, splash-wordmark class) persist after React mounts. Remove the `<style>` block from DOM after splash dissolves.

### Files Modified

1. **`public/icons/swipess-brand-logo.webp`** — New optimized logo (resized + WebP)
2. **`index.html`** — Use WebP logo in splash, remove unused unsplash preconnect, cleanup splash styles after hydration
3. **`src/components/SwipessLogo.tsx`** — Reference new WebP logo
4. **`vite.config.ts`** — Add `vendor-forms` chunk for zod + react-hook-form
5. **`src/App.tsx`** — Defer i18n import to after initial render

### Expected Impact

- LCP: ~4.9s → ~2.5s (logo goes from 62KB to ~6KB, already decoded size)
- Unused JS: ~297KB → ~270KB (i18n + forms moved out of critical path)
- Image delivery warning: eliminated
- Performance score: estimated 79 → 88-92 on mobile


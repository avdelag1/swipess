## Goal

Make swipe cards visually fill the entire screen (rounded corners preserved), guarantee responsiveness across phones/tablets/iPads/desktop, raise PWA performance via aggressive prefetching/caching, and fix low-contrast white icons/buttons (notably the AI chat Send button).

---

## 1. Full-Bleed Swipe Card (rounded corners kept)

Files: `src/components/SwipessSwipeContainer.tsx`, `src/components/SimpleSwipeCard.tsx`, `src/components/SimpleOwnerSwipeCard.tsx`, `src/components/DashboardLayout.tsx`.

- Container `flex-1` area: remove inner horizontal padding so card spans `100vw` and stretches vertically from just under the safe-area top (header buttons row) to just above the bottom nav bar (action buttons + nav).
- `SimpleSwipeCard` wrapper: keep `border-radius: var(--radius-md)` but bump card to `inset: 0` of the available stage. Use CSS env safe-area insets so notched devices don't clip:
  - top: `calc(var(--safe-top,0px) + 4px)`
  - bottom: `calc(var(--bottom-nav-height,64px) + 8px)`
  - left/right: `4px` (subtle margin so rounded corners breathe).
- Same change to `SimpleOwnerSwipeCard`.
- Image element: ensure `object-cover` + `width:100%; height:100%` (already true) so photo fills card edge-to-edge under the gradients.

## 2. Responsive Across Devices

- Tablet/iPad/desktop (≥768px): cap card width at `min(100vw, 560px)` and center, keep full height; this avoids ultra-wide stretched photos while still feeling immersive.
- Phones (<768px): true edge-to-edge.
- Implement via Tailwind responsive classes on the card stage container in `SwipessSwipeContainer.tsx`.
- Verify `--bottom-nav-height` and `--safe-top` are written in `DashboardLayout` for ALL routes (currently authoritative there per memory).

## 3. PWA Performance (fast cold start + offline)

Files: `vite.config.ts`, `public/sw.js`, `src/lib/swipe/ImagePreloadController.ts`.

- Tighten Workbox runtime caching:
  - HTML: `NetworkFirst`, 3s timeout (already required).
  - JS/CSS: `StaleWhileRevalidate`, 1y maxAge.
  - Images (Supabase storage + same-origin): `CacheFirst`, maxEntries 300, 30 days.
  - Supabase REST GETs (listings, profiles): `StaleWhileRevalidate`, 5 min, 100 entries.
- Preload first 5 deck cards' ALL images (not just 3) the moment the deck resolves, via `imagePreloadController.preloadBatch`.
- Add `<link rel="preconnect">` + `dns-prefetch` for Supabase URL in `index.html`.
- Add `loading="eager"` + `fetchpriority="high"` on the top card image, `loading="lazy"` on the rest.
- Keep `navigateFallbackDenylist: [/^\/~oauth/]` and disable SW in iframe/preview.

## 4. White Icon/Text Contrast Pass

Problem: many white-on-white-ish glass buttons are invisible on bright photos. Notable: AI chat Send button arrow.

- In `ConciergeChat.tsx`: send button — change to solid brand orange background with white icon, add `shadow-md` and `border border-white/20`. Disabled state stays muted.
- Audit pass for buttons using `bg-white/X border-white/Y` with white icons over photos (header buttons in `SwipessSwipeContainer`, share/report on `SimpleSwipeCard`):
  - Wrap icon in stronger backdrop: `bg-black/55 backdrop-blur-md` (already present on some) — apply same standard everywhere.
  - Icon `stroke-white` with `drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]` so it pops on any image.
- Tokenize via a new utility class `.glass-icon-btn` in `src/styles/premium-polish.css` so future buttons stay consistent.

## 5. Apple Compliance Sanity Checks

- Respect notches via `env(safe-area-inset-*)` everywhere card and nav touch screen edges.
- All tap targets ≥44×44pt (audit action button row — already 64–72px ✓).
- No hidden gestures conflicting with iOS swipe-back; keep `touch-action: pan-y` on scrollers (already in memory).

---

## Out of Scope

- Logic changes to swipe physics, routing, or backend.
- Complete visual redesign — this is refinement only.

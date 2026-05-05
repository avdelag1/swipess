# Public Preview + Splash + Refresh Loop Fixes

The screenshot shows the listing card is being clipped by header buttons and the page scrolls into a black void. The splash also pops in awkwardly, and the app keeps refreshing in preview. We will address all three in one pass.

## 1. Single-viewport public preview (no scroll)

Files: `src/pages/PublicListingPreview.tsx`, `src/pages/PublicProfilePreview.tsx`

- Convert layout from scrollable column to a fixed `h-[100dvh]` flex column with `overflow-hidden`.
- Remove the absolutely-positioned top nav so it cannot overlap the card. Instead make a slim flex header row at the top of the column (back, wordmark, share) with safe-area top padding.
- Hero swipe card grows with `flex: 1 1 auto` and `min-h-0` so it fills the available space between header and CTAs without overflow. Replace fixed `aspectRatio: '3 / 4.4'` on `PreviewSwipeCard` with an optional `fill` mode that absorbs parent height.
- CTA stack pinned at the bottom with safe-area bottom padding. "Create Account" and "Sign In" stay full-width but slightly shorter (h-12) to guarantee fit on small Android screens (392x779 in current viewport).
- Tighten the bottom gradient + overlay typography (title `text-2xl`, stats chips `w-12 h-12`) so all content sits inside the card on one screen.
- Same treatment applied to `PublicProfilePreview.tsx`.

Technical note: `PreviewSwipeCard` gets a `fill?: boolean` prop. When true, drop the `aspectRatio` style and use `absolute inset-0` plus `h-full w-full` so the parent flex item controls size.

## 2. Splash screen polish

File: `index.html`

- Remove the abrupt "pop" by starting splash visible (no breathing-from-zero), keeping a single soft scale breathe but with `opacity: 1` baseline.
- Add a thin progress shimmer line under the wordmark so it never looks frozen.
- Shorten safety fallback to 1200ms but extend fade-out to 500ms with `cubic-bezier(0.22, 1, 0.36, 1)` for a cinematic exit.
- Ensure `swipess-ready` event is dispatched from `src/main.tsx` right after first paint (verify; if missing, add a `requestAnimationFrame` dispatch after `createRoot().render`).

## 3. Stop the constant refresh / dynamic-import failures

Runtime error logged: `Failed to fetch dynamically imported module: ClientDashboard.tsx`. This is the classic Vite stale-chunk problem after a hot rebuild — the SW serves the old `index.html` whose chunk hashes no longer exist, so the app reloads in a loop.

Files: `public/sw.js`, `src/utils/lazyRetry.ts` (verify current behavior first)

- In `public/sw.js`: switch the navigation/HTML strategy to network-first with no-cache for `index.html`, and never cache `/assets/*-[hash].js` responses that return 404. Add a `skipWaiting` + `clients.claim` upgrade path so a new SW takes over without forcing the user into a refresh cycle.
- In `lazyRetry.ts`: when a chunk import fails twice, do a single `location.reload()` with a `?v=timestamp` query so the next load gets fresh `index.html`. Guard with `sessionStorage` so it can only auto-reload once per session — eliminates the infinite loop.
- Add `<meta http-equiv="Cache-Control" content="no-cache">` only for the dev/preview HTML via Vite middleware is unnecessary; the SW change is sufficient.

## 4. QA

- Visually verify on 392x779 (current viewport) that the public listing fits without scroll, header doesn't overlap, CTAs are fully visible.
- Reload the preview a few times to confirm the dynamic-import error no longer triggers a refresh storm.
- Confirm splash fades smoothly without a flash of black.

## Out of scope

- No layout, routing, or swipe-physics changes elsewhere.
- No backend changes.
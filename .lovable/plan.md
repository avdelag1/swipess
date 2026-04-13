
Goal: fix only the two broken likes pages so vertical scrolling works from anywhere on the page, not just the exposed top area.

What I found
- The actual root cause is global CSS, not the card component itself.
- In `src/styles/pwa-performance.css`, there is a rule:
  ```css
  [data-no-swipe-nav] {
    touch-action: pan-x !important;
    overscroll-behavior-x: none;
    -webkit-user-select: none;
    user-select: none;
  }
  ```
- Both broken pages use `data-no-swipe-nav="true"` on their root wrapper:
  - `src/pages/ClientLikedProperties.tsx`
  - `src/components/LikedClients.tsx`
- Because `touch-action` is intersected across ancestors, that global `pan-x !important` blocks normal vertical scroll whenever the gesture starts inside those page surfaces/cards. That matches exactly what you described: only some exposed areas scroll, while the card area feels dead.
- `PremiumLikedCard.tsx` is no longer the main blocker. The global `data-no-swipe-nav` rule is overriding the page’s intended `pan-y`.

Implementation plan
1. Fix the route-level touch policy
- Update `src/styles/pwa-performance.css`.
- Stop forcing every `[data-no-swipe-nav]` area to `touch-action: pan-x !important`.
- Replace it with a safer rule that only disables horizontal swipe-nav behavior without killing vertical page scroll.

2. Harden the two affected pages explicitly
- Update:
  - `src/pages/ClientLikedProperties.tsx`
  - `src/components/LikedClients.tsx`
- Keep them on unified parent scroll flow (`min-h-full overflow-visible`).
- Add explicit route-safe classes/attributes so these two pages always prefer vertical touch scrolling across the full content area.

3. Ensure card surfaces inherit vertical scroll correctly
- Re-check `src/components/PremiumLikedCard.tsx`.
- Keep the card root, image area, and content area aligned to `pan-y`.
- Keep actions clickable only on actual buttons.

4. Preserve swipe-navigation blocking without breaking scroll
- Review `src/hooks/useSwipeNavigation.ts` usage indirectly via the existing `data-no-swipe-nav` behavior.
- Keep horizontal route-swipe navigation disabled on these pages, but do it without a CSS rule that suppresses vertical gestures.

Expected result
- Both pages:
  - `/client/liked-properties`
  - `/owner/liked-clients`
  will scroll naturally from anywhere the finger starts, including directly on cards.
- Buttons like Message/View/Trash will still work on tap.
- No broader redesign is needed; this is a targeted touch-behavior fix.

Technical detail
- The bug is caused by:
  ```css
  [data-no-swipe-nav] { touch-action: pan-x !important; }
  ```
  on the same wrappers that are supposed to scroll vertically.
- The fix is to remove or narrow that global rule and let these likes pages use `pan-y` at the page/card surface level.

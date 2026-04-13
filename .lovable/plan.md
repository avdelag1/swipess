
Goal: fix the two real problems still present on the likes flows: missing back/close controls in preview states with no image, and scrolling only working on exposed parts of the page instead of across the cards themselves.

What I found
- `src/components/LikedClientInsightsModal.tsx` only shows the back/close buttons inside the `clientImages.length > 0` branch. If a liked client has no photo, the modal shows a placeholder and no back button at all. The same structural issue needs to be hardened in `src/components/LikedListingInsightsModal.tsx`.
- The likes pages already live inside `DashboardLayout`’s `#dashboard-scroll-container`, but their page shells still use standalone `min-h-[101dvh]` wrappers instead of the unified `min-h-full overflow-visible` pattern.
- The main touch problem is `src/components/PremiumLikedCard.tsx`: the whole image/header area is a tap target (`onClick` on the full image block), so when the finger starts on the card, the UI behaves like a tappable surface instead of a scroll-first surface.
- Both client and owner likes flows reuse `PremiumLikedCard`, so the same bug affects both sides.

Implementation plan
1. Fix missing back buttons on preview modals
- Update:
  - `src/components/LikedClientInsightsModal.tsx`
  - `src/components/LikedListingInsightsModal.tsx`
- Move back/close controls out of the “has images” branch and into a persistent top overlay/header.
- Keep the back action as modal close so users return instantly to the likes page underneath.

2. Re-align likes pages with the shared scroll architecture
- Update:
  - `src/pages/ClientLikedProperties.tsx`
  - `src/components/LikedClients.tsx`
- Replace the current `min-h-[101dvh]` page shells with `min-h-full overflow-visible`-style wrappers so the parent `#dashboard-scroll-container` remains the only real scroller.
- Preserve `touch-pan-y` and `data-no-swipe-nav="true"`.

3. Make card surfaces scroll-first
- Refine `src/components/PremiumLikedCard.tsx` so vertical dragging wins everywhere except on explicit action buttons.
- Remove the full-card/header tap behavior from the whole image region.
- Keep “View” as a deliberate action button or smaller explicit target, instead of making the full top half of the card capture touches.
- Keep decorative layers passive and maintain `touch-action: pan-y` on non-button surfaces.

4. Reduce extra interaction layers on likes grids
- Update:
  - `src/pages/ClientLikedProperties.tsx`
  - `src/components/LikedClients.tsx`
- Simplify the per-card wrappers so they do not add extra touch/interactivity weight above the real scroll container.
- Keep visual polish, but prioritize reliable finger scrolling over animated wrapper behavior.

5. Mirror the same fix on related owner/client card pages
- Apply the same card-scroll treatment to:
  - `src/pages/OwnerInterestedClients.tsx`
  - `src/pages/ClientWhoLikedYou.tsx`
- This keeps all liked/interested card pages consistent instead of fixing only one route.

Expected result
- The preview modals always have a visible back button, even when there is no image.
- The client and owner likes pages scroll from anywhere the finger starts, including directly on top of the cards.
- Buttons still work on tap, but dragging on the card surface scrolls the page naturally.

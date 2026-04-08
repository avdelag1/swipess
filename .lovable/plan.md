
Goal: make Likes/Interested pages scroll reliably on client and owner side, and remove the ugly quick-filter image loading/cracking before the breathing animation starts.

What I found:
- The likes pages are still using the shared `#dashboard-scroll-container` in `DashboardLayout.tsx` (`overflow-y-auto`), but these pages behave better as their own scroll surfaces.
- `OwnerInterestedClients.tsx` also renders `PremiumSortableGrid`, which adds drag/long-press behavior inside the same vertical interaction area and can still interfere with natural mobile scrolling.
- Quick-filter cards in `QuickFilterBar.tsx` and `CategorySwipeStack.tsx` use raw `<img>` tags, so images appear before decode is visually stable.
- The client “All” quick-filter card still uses an external Unsplash URL instead of the local prewarmed asset set.
- Filter images are being pre-decoded in more than one place, which adds redundant work and inconsistent first paint.

Implementation plan

1. Restore page-owned scrolling for likes pages
- Update `DashboardLayout.tsx` to detect likes/interested routes and switch the main container from scroll owner to shell only (`overflow-hidden` for those routes).
- Give these pages their own scroll container:
  - `src/pages/ClientLikedProperties.tsx`
  - `src/components/LikedClients.tsx`
  - `src/pages/OwnerInterestedClients.tsx`
- Standardize each page root to:
  - `h-full min-h-0 overflow-y-auto touch-pan-y`
  - `WebkitOverflowScrolling: 'touch'`
  - `overscrollBehaviorY: 'contain'`
- Keep inner content `min-h-full` so the page always has a stable scroll surface.

2. Remove drag/scroll conflict on owner interested page
- Adjust `OwnerInterestedClients.tsx` + `PremiumSortableGrid.tsx` so scrolling is never blocked by reorder behavior.
- Best implementation: make reorder opt-in instead of always armed on the main list.
  - Desktop can keep drag behavior.
  - Touch devices should default to pure scrolling unless a dedicated reorder mode/handle is active.
- This preserves the page’s function while prioritizing reliable vertical scroll.

3. Fix quick-filter image cracking/loading flash
- Replace the raw quick-filter `<img>` usage with a shared progressive image layer for:
  - `src/components/QuickFilterBar.tsx`
  - `src/components/CategorySwipeStack.tsx`
- Reuse the proven pattern already present in `CardImage.tsx`:
  - hidden placeholder/blur layer
  - decode before reveal
  - short crossfade
  - animation only after load completes
- Add a gradient fallback background so the user never sees black bands or broken paint while the image is decoding.

4. Eliminate the worst quick-filter image source
- Replace the external Unsplash image on the client “All” quick-filter card with the local shared asset from `POKER_CARD_PHOTOS.all`.
- This removes the extra network dependency and aligns that card with the rest of the prewarmed local filter assets.

5. Remove duplicate prewarming and stabilize first paint
- Consolidate filter-image prewarming so only one system owns it.
- Keep the top-level prewarmer as the source of truth and remove duplicate decode work from `CategorySwipeStack.tsx`.
- Ensure the breathing animation starts only after the image is visibly ready, so users never see the image “crack” while zooming.

Files to update
- `src/components/DashboardLayout.tsx`
- `src/pages/ClientLikedProperties.tsx`
- `src/components/LikedClients.tsx`
- `src/pages/OwnerInterestedClients.tsx`
- `src/components/PremiumSortableGrid.tsx`
- `src/components/QuickFilterBar.tsx`
- `src/components/CategorySwipeStack.tsx`
- optionally a new small shared quick-filter image component if that keeps the fix clean and consistent

Technical details
- Scroll ownership will move from layout-level to page-level for the affected likes/interested routes.
- Touch behavior will explicitly favor `pan-y` and inertial scrolling.
- Quick-filter photos will use decode-first rendering with a crossfade instead of immediate raw image paint.
- The 14s breathing zoom stays, but only begins after the image is loaded and stable.

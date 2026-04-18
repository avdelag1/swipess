
Goal: make the discovery screen feel like one fast, clean iOS-style module: one map only, no self-motion, compact quick filters + KM controls, visible blue radar center, a real back button, and everything fitting between the header and bottom nav.

1. Replace the current “full-screen flexible map” with a fixed square-ish radar module
- In `DiscoveryMapView.tsx`, stop letting the map consume `flex-1`.
- Build a tighter vertical layout:
  - top utility row
  - compact square map
  - quick category filters
  - fast horizontal KM selector
  - primary action
- Cap the map to something like `min(46svh, 360px)` and use `aspect-square`/near-square sizing so it stays centered and never feels oversized.

2. Remove the “map moving by itself” behavior
- Delete or disable inertia in both `DiscoveryMapView.tsx` and `LocationRadiusSelector.tsx`.
- Keep drag-to-pan only while the finger is actually down.
- Prevent any auto-shift after release.
- Also ensure location detect does not visually re-pan in a floaty way; it should snap cleanly back to the user center.

3. Make the radar center obvious again
- Strengthen the blue center marker and radar ring in the canvas draw logic.
- Increase contrast of:
  - center blue dot
  - white outline
  - outer pulse/ring
- Make sure dark overlay does not wash it out.

4. Stop rendering duplicate map experiences
- Right now the app mixes:
  - `DiscoveryMapView`
  - `LocationRadiusSelector` minimal
  - `LocationRadiusSelector` full inside exhausted state
- Unify the client flow so each state shows only one map module at a time.
- For empty/exhausted state, keep the same compact map structure instead of switching to a different oversized layout.

5. Add the missing compact quick filters under the map
- Reintroduce the small category selectors as compact icon pills under the map, not as a giant header bar.
- Match existing compact category pattern from memory:
  - 40px circular/compact buttons
  - strong active accent
  - minimal labels or icon-first treatment
- Keep them responsive and horizontally scrollable only if needed.

6. Replace the slow slider feel with fast KM pills
- The user wants the KM selector to feel as fast as the nav buttons.
- Prioritize the preset KM chips as the main control under the map.
- Keep any continuous slider secondary or remove it if it adds lag.
- Improve responsiveness by:
  - reducing transition weight
  - using immediate state updates for presets
  - simplifying motion on active-chip centering

7. Move the location detector and add a proper back button
- In `DiscoveryMapView.tsx`, remove the current location button from the top-left area.
- Put Back on the left top corner.
- Move location detect into a secondary map control position, likely top-right or bottom-right of the map, with a smaller iOS-style glass button.
- Keep Refresh separate but visually subordinate.

8. Fix the top-left profile/name pill so it truly fits the name
- In `TopBar.tsx`, make the pill width content-driven instead of visually clipping the text.
- Keep max 10 visible characters, but size the pill around those 10 characters rather than forcing the text into a too-tight shell.
- Adjust left cluster spacing so the right-side icons shift naturally instead of compressing the pill.

9. Tighten the overall vertical fit between header and bottom nav
- Recheck `ClientDashboard.tsx`, `SwipeAllDashboard.tsx`, `SwipessSwipeContainer.tsx`, and map-related wrappers.
- Remove extra vertical dead space so the map + filters + action area sit comfortably within the safe viewport.
- Use the layout memory rule: rely on dashboard/header/nav spacing as the source of truth instead of stacking extra local padding.

Files to update
- `src/components/swipe/DiscoveryMapView.tsx`
- `src/components/swipe/LocationRadiusSelector.tsx`
- `src/components/swipe/SwipeExhaustedState.tsx`
- `src/components/SwipessSwipeContainer.tsx`
- `src/components/TopBar.tsx`
- possibly `src/pages/ClientDashboard.tsx` for container sizing cleanup

Expected result
- One map only
- Smaller centered square radar
- No automatic drifting
- Visible blue radar center
- Back button in the correct place
- Location detector moved away from top-left
- Small quick filters below the map
- Fast KM selection below that
- Better name pill fit
- Everything fitting cleanly between the top header and bottom navigation

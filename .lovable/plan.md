
Goal: remove the splash/frame transition artifact, fix the broken Events feed interactions, and expand the lighter glass effect across header/navigation controls without changing the app’s structure.

1. Remove the splash/frame effect cleanly
- Strip the remaining splash dissolve/“hydrated” transition behavior that can create a visible frame band before or after boot.
- Keep the boot surface fully black and instantaneous, with no extra fade layer sitting above the app.
- Preserve the wordmark-only loading feel if needed, but make the handoff to the app direct and frameless.

2. Fix the Events page interaction bugs
- Remove or drastically shrink the oversized invisible tap zones inside `EventCard` that are intercepting scroll/swipe gestures and creating the mysterious “square/button” near the right-side actions.
- Restore natural vertical swipe/scroll priority so the feed behaves like a proper snap-scroll story feed again.
- Keep navigation affordances, but move them to smaller explicit controls or non-blocking edge hints so they do not sit on top of the content.

3. Fix category switching on Events
- Reset the feed to the first card whenever the category changes.
- Reset the active index and scroll position so Beach/Jungle/All do not appear stuck or inconsistent.
- Handle empty and short filtered lists safely so the page never feels frozen.

4. Harden the Events route loading
- Replace the plain lazy load for `EventosFeed` with the same retry-safe lazy loading already used elsewhere.
- Review related event-page imports so transient chunk fetch failures do not leave the page broken.

5. Refine the Events HUD glass and consistency
- Keep the floating back button and filter row, but tune their glass styling to match the newer premium header treatment.
- Ensure the HUD remains visible/usable without creating dark frame bands or obstructing gestures.

6. Expand the glass effect across header buttons
- Apply the glass treatment consistently to the actual header controls: back button, profile/name cluster, mode switcher, radio, theme toggle, and notifications.
- Use a shared lighter glass recipe so these buttons feel individual and premium, not just grouped inside one blurred capsule.
- Keep the current split-anchor layout and mobile fit intact.

7. Reduce blur strength on bottom navigation active buttons
- Lower the active button blur a bit and slightly increase transparency so more of the background comes through.
- Preserve the existing glass feel, just make it clearer and less foggy.

Technical details
- Files likely touched:
  - `index.html`
  - `src/pages/EventosFeed.tsx`
  - `src/components/events/EventCard.tsx`
  - `src/App.tsx`
  - `src/components/TopBar.tsx`
  - `src/components/BottomNavigation.tsx`
  - possibly small related button components like `ThemeToggle.tsx`, `ModeSwitcher.tsx`, `NotificationPopover.tsx`
- Root causes identified:
  - splash handoff still relies on layered dissolve timing
  - `EventCard` has large absolute buttons covering much of the card, likely blocking scroll and causing the phantom square/chevron behavior
  - category changes do not reset feed position/index
  - `EventosFeed` uses plain `lazy()` instead of the project’s retry-safe lazy loader

Validation after implementation
- Open app from cold start: no frame flash before or after splash
- Events page:
  - vertical swipe/scroll works anywhere on the card
  - no phantom square/button near action buttons
  - Beach/Jungle/All/Restaurants switch correctly and immediately
  - back button and filters still float and remain usable
- Header/nav:
  - glass effect visible on header controls
  - bottom nav shows more background through active buttons
  - no layout crowding or loss of touch responsiveness

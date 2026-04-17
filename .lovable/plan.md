

## Full-Screen Map Discovery + In-Card Action Icons

### What Changes

**1. Redesign LocationRadiusSelector into a portrait-size interactive map**
- Replace the current small 240px canvas with a **full-width, tall map** (`width: 100%, height: calc(100dvh - 200px)`) that fills the discovery area when no card is showing or when toggled
- Make the map **touch-draggable** -- track pan gestures to offset the map center (finger panning shifts `userLat`/`userLng` offset), smooth momentum scrolling
- **Km selector** becomes a horizontal sliding pill bar at the bottom of the map (same instant-slide feel as the nav bar buttons) with preset values (1, 5, 10, 25, 50, 100 km) that slide left/right with touch
- **GPS button** as a floating icon in bottom-right corner of the map
- **Category quick-filter buttons** overlaid on map corners/edges (top-left row or bottom edge)
- **Remove all text labels/descriptions** -- icons only, self-explanatory with size and color
- Radius circle overlay updates live as user slides the km selector
- Load more tiles dynamically as user pans the map

**2. Move action buttons INSIDE the swipe card**
- **Remove** the external `SwipeActionButtonBar` from both `SwipessSwipeContainer` and `ClientSwipeContainer`
- The `DiscoverySidebar` (already inside `SimpleSwipeCard`) becomes the sole action interface
- Add **Like (flame)** and **Dislike (thumbs down)** icons to the `DiscoverySidebar` alongside existing Undo, Message, Share, Insights icons
- Right swipe = like, left swipe = dislike -- the card itself IS the interaction, buttons are just shortcuts
- Same treatment for `SimpleOwnerSwipeCard` -- add a similar sidebar with: Undo, Dislike, Like, Message, Share, Insights
- **Tap center of card** = opens insights page (already wired)

**3. Apply to both Client and Owner sides + Roommates**
- `SwipessSwipeContainer` (client side): remove bottom `SwipeActionButtonBar`, rely on in-card sidebar
- `ClientSwipeContainer` (owner side): same removal, add sidebar to `SimpleOwnerSwipeCard`
- Roommate swipe cards: same pattern

### Files to Modify

| File | Change |
|------|--------|
| `src/components/swipe/LocationRadiusSelector.tsx` | **Rewrite** -- portrait map, touch pan, sliding km pills, no text labels, corner filter buttons |
| `src/components/DiscoverySidebar.tsx` | Add Like + Dislike buttons to the sidebar |
| `src/components/SimpleSwipeCard.tsx` | Already has DiscoverySidebar -- no change needed |
| `src/components/SimpleOwnerSwipeCard.tsx` | Add DiscoverySidebar with all action icons |
| `src/components/SwipessSwipeContainer.tsx` | Remove `SwipeActionButtonBar` render block (lines 1108-1119) |
| `src/components/ClientSwipeContainer.tsx` | Remove `SwipeActionButtonBar` render block (lines 948-958), pass action handlers to card |
| `src/components/SwipeActionButtonBar.tsx` | Keep file but no longer rendered in swipe containers |

### Technical Approach

**Map panning**: Track `onPointerDown/Move/Up` on the canvas container. Accumulate pixel deltas, convert to lat/lng offset using the tile math already in place. Apply inertia with `requestAnimationFrame` decay.

**Km sliding selector**: Horizontal scrollable row of circular buttons (1, 5, 10, 25, 50, 100) with `scroll-snap-x` and `overscroll-behavior: contain`. Active button glows primary color. Same physics as nav bar horizontal scroll.

**In-card sidebar layout** (vertical stack, right edge):
```
[Match %]
[Undo]
[Dislike - red]
[Like - flame orange]  
[Message]
[Share]
[Insights]
```


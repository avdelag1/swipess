
## What I found

- The quick-filter card shake is real: the top card currently mixes three moving systems on the same element/layer:
  1. swipe drag (`x`, `rotateZ`)
  2. gyroscope parallax (`rotateX`, `rotateY`)
  3. photo breathing animation (`photo-swim`)
- The session data also shows rapid repeated `rotateX/rotateY` updates, which matches the jitter you feel while dragging.
- The header and bottom nav already scroll horizontally, but right now they only use simple fade hints. They do not have the proper rounded “tunnel” clipping effect you described.

## Plan

### 1. Stabilize the quick-filter swipe cards
- Refactor `PokerCategoryCard.tsx` into separate motion layers:
  - outer stack/position layer
  - drag gesture layer
  - inner parallax visual layer
  - image breathing layer
- Freeze or decouple gyroscope updates while the user is actively dragging, then restore them after release.
- Keep all wanted behaviors:
  - parallax when resting
  - breathing photo effect
  - swipe left/right
  - tap a lower card to bring it forward
- Tune the drag release so it feels clean and premium, not twitchy.

### 2. Make the cards large again without clipping
- Restore a taller shared card height for both client and owner dashboards.
- Use one shared responsive sizing rule so client and owner stay visually identical.
- Make sure the button, title, and image all remain fully visible on smaller phones.

### 3. Rebuild the top header as a real glass “tunnel”
- Keep the avatar/photo as the fixed left anchor.
- Start the scrollable tunnel exactly after that rounded avatar edge.
- Put the crowded header actions inside a clipped horizontal glass rail so they slide behind rounded left/right ends instead of overlapping.
- Add subtle inner shade/depth so it feels futuristic and intentional, not just faded.
- Preserve tap-vs-scroll behavior so horizontal dragging the header never accidentally triggers buttons.

### 4. Apply the same tunnel idea to the bottom navigation
- Keep horizontal scrolling for narrow phones.
- Add rounded tunnel edges and shaded mask walls on both sides.
- Make nav items disappear behind the tunnel edges cleanly as you scroll.
- Preserve instant tap response and active-state clarity.

### 5. Keep owner and client perfectly in sync
- Apply the exact same swipe-deck fixes to:
  - `SwipeAllDashboard.tsx`
  - `OwnerAllDashboard.tsx`
- Share sizing, spacing, and motion behavior so one side never drifts from the other again.

## Technical details

**Files to update**
- `src/components/swipe/PokerCategoryCard.tsx`
- `src/components/swipe/SwipeAllDashboard.tsx`
- `src/components/swipe/OwnerAllDashboard.tsx`
- `src/hooks/useDeviceParallax.ts`
- `src/components/TopBar.tsx`
- `src/components/BottomNavigation.tsx`
- possibly a small mask/shade utility in `src/index.css`

**Implementation notes**
- Main card fix: stop combining drag + gyro + breathing on the same transform layer.
- Main header/nav fix: replace the current simple edge fades with a true rounded clipping/masking tunnel.
- No routing or feature logic changes; this is a polish/stability pass focused on motion, layout, and responsiveness.

## QA I will do after implementation
- Repeatedly swipe the quick-filter cards left/right on mobile width and confirm no shaking.
- Confirm breathing + parallax return smoothly when not dragging.
- Confirm tapping back cards still brings them forward.
- Verify the full card stays visible on both client and owner dashboards.
- Verify top and bottom controls scroll inside the new tunnel rails and hide behind rounded edges cleanly.

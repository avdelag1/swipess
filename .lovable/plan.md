# Refine Swipe Affordances & Make Vertical Browse Reversible

Three connected fixes for the swipe deck (client, owner, roommate):

## 1. Bottom tap-affordance: pill bar → tiny dot, raised above nav

In `src/components/swipe/ChromeSummonZones.tsx`, the bottom strip currently shows a 44×3 white pill that overlaps the bottom navigation icons.

- Replace the pill with a single 6px circular dot (`width: 6, height: 6, borderRadius: 999`), same subtle white/glow.
- Raise its position so it sits *above* the nav bar buttons: change the strip's `bottom` from `0` to `calc(var(--safe-bottom, 0px) + var(--bottom-nav-height, 64px) + 4px)` and reduce strip height to ~28px so the dot doesn't sit on top of nav icons.
- Keep the same tap-to-toggle-chrome behavior.

## 2. Top tap-affordance: pill → small downward chevron

Same file, top strip currently also shows a 44×3 white pill. The user wants something that *signals "pull down to close the deck"*.

- Replace that pill with a small downward chevron icon (Lucide `ChevronDown`, ~18px, `rgba(255,255,255,0.6)`, soft drop-shadow), centered, sitting just below the top safe area.
- Keep the tap-to-toggle-chrome behavior on the strip itself; the chevron is purely visual and `pointer-events: none`.
- Keep the existing left-side scroll/page indicator unchanged (user mentioned it works well).

## 3. Vertical swipe = reversible browse (no like/dislike), across all decks

Today vertical swipe calls `onSkip` which advances `currentIndex` forward only — once you swipe down past a card, it's gone. The user wants vertical to be a pure pager: down = next card, up = previous card, idempotent.

### `src/components/SimpleSwipeCard.tsx` and `src/components/SimpleOwnerSwipeCard.tsx`
- Add an optional `onSkipBack?: () => void` prop alongside the existing `onSkip`.
- In `handleDragEnd` vertical branch, route the gesture by direction:
  - `dy > 0` (drag down) → `onSkip?.()` (next card)
  - `dy < 0` (drag up)   → `onSkipBack?.()` (previous card)
- Keep the cinematic exit animation, but bias the exit-Y direction to match the drag direction so the card always travels off the side it was pulled toward, then the next/previous one rises in.
- No backend write occurs in either direction (this stays purely a pager).

### `src/components/SwipessSwipeContainer.tsx` and `src/components/ClientSwipeContainer.tsx`
- Add `handleSkipBack`: decrement `currentIndexRef.current` (clamp at 0), call `setCurrentIndex`, no swipe-engine write, no haptic stronger than `light`.
- Pass `onSkipBack={handleSkipBack}` to the rendered `SimpleSwipeCard` / `SimpleOwnerSwipeCard`.
- Keep `handleSkip` unchanged (forward).
- No change to like/dislike (`onSwipe`) — horizontal commits remain the only path that writes to `likes`/dismisses.

### `src/pages/RoommateMatching.tsx`
- Maintain a small index/history in the page so swipe-up returns to the previously viewed roommate card without re-fetching.
- Wire `onSkip` (advance) and `onSkipBack` (rewind) on the `SimpleOwnerSwipeCard` instance. Horizontal swipe still calls `handleSwipe` (the existing like/pass with backend write).
- The `nextCard` peek behind the top card stays as today.

### Quick filter card stack (`src/components/swipe/PokerCategoryCard.tsx`)
- Already uses straight-line axis-locked vertical motion. Confirm vertical commit moves to next category card and add a back-rewind handler symmetric to the deck containers, so up/down on quick filters also browses without consuming.

## What does NOT change
- Pull-down-from-top-edge to dismiss the deck (still active, governed by `usePullDownToDismiss`).
- Horizontal swipe = like/pass with backend write and exit-X fly-off.
- Action button bar (Undo / Dislike / Message / Like / Insights).
- Card photo cycling on tap (left/right thirds).
- Center tap to toggle chrome.

## Files touched
- `src/components/swipe/ChromeSummonZones.tsx`
- `src/components/SimpleSwipeCard.tsx`
- `src/components/SimpleOwnerSwipeCard.tsx`
- `src/components/SwipessSwipeContainer.tsx`
- `src/components/ClientSwipeContainer.tsx`
- `src/pages/RoommateMatching.tsx`
- `src/components/swipe/PokerCategoryCard.tsx`

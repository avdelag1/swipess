
# Plan: Switch listing swipe from horizontal to vertical

## What changes

Today: drag the card **right** = like, **left** = pass, pull from top = exit deck.
After: drag the card **up** = like, **down** = pass, pull-down-from-top remains as the "exit deck" gesture.

The active gesture surface is the card area sitting between the header chrome and the bottom navigation chrome — exactly the region you described.

## Where the work happens

1. **`src/components/SimpleSwipeCard.tsx`** and **`src/components/SimpleOwnerSwipeCard.tsx`** — the card itself
   - Switch `drag` axis from `x` to `y` (`drag="y"`).
   - Move all motion-derived visuals onto the y axis:
     - Rotation (currently from x) → small tilt from y, or remove rotation entirely (Instagram-style flat slide).
     - "LIKE" / "NOPE" overlay opacities now driven by y (negative = LIKE, positive = NOPE).
     - Exit animation: `animate(y, -windowHeight)` for like, `animate(y, +windowHeight)` for pass.
   - Update `handleDragEnd` thresholds: read `info.offset.y` and `info.velocity.y` instead of x.
   - Update `handleButtonSwipe` (used by floating like/pass buttons) to animate y instead of x.

2. **Pull-down-to-exit (`usePullDownToDismiss.tsx`)** — keep, but reserve only the **top zone** of the card for it
   - Currently it activates when the touch starts in the upper 60% of the deck. That will conflict with the new "swipe up = like" gesture.
   - Restrict it to the top ~80px of the card (or to a dedicated thin grab-handle strip at the very top), so the rest of the card is free for vertical like/pass swipes.
   - Pull-down still exits to dashboard with the curtain effect.

3. **`useSwipeWithMatch.tsx` / parent containers (`ClientSwipeContainer`, `SwipessSwipeContainer`)** — semantics
   - Internally we keep the `'left' | 'right'` direction strings (left = pass, right = like) so backend, likes table, match logic, undo, sounds, and analytics keep working untouched.
   - The card just maps `up → 'right'` and `down → 'left'` when calling `onSwipe`.
   - This is the safest path; no DB or matching logic changes.

4. **Match overlays / labels**
   - "LIKE" badge, "NOPE" badge: reposition so LIKE appears at the top of the card and NOPE at the bottom (instead of left/right corners). Drive opacity from y.

5. **Action buttons (floating thumbs up / thumbs down)**
   - Behaviour stays identical from the user's POV; under the hood `triggerSwipe('right')` now flies the card up instead of right.

## Things that could break — audit list

These are the systems I checked that touch the swipe gesture and must be re-tested:

| Area | File(s) | Risk |
|---|---|---|
| Photo carousel tap zones (left third / right third of card cycles photos) | `SimpleSwipeCard.tsx` `handleImageTap` | Low. Tap is a click, not a drag, so it stays. But we should confirm a vertical drag doesn't accidentally fire a tap. |
| Long-press zoom magnifier (`useMagnifier`) | `SimpleSwipeCard.tsx` | Medium. The current code waits for movement to decide between "zoom" vs "drag". Threshold logic needs to consider y movement now too. |
| Pull-to-refresh (Instagram-style downward pull at top) | `mem://features/pull-to-refresh` | High. Downward pull at top of card will now also mean "swipe down = pass". We need a clear separation: pull-to-refresh and pull-to-exit-deck both live at the top edge; "swipe down = pass" must start from the **middle** of the card, not the top. |
| Pull-down-to-dismiss the deck | `usePullDownToDismiss.tsx` | High — same conflict as above. Solution: top ~80px reserved for pull-to-exit; rest of card = like/pass. |
| Horizontal scroll containers below card (filter chips, thumbnails) | `OwnerAllDashboard.tsx`, top-bar chips | Low — those are outside the card. |
| Undo last swipe (`useSwipeUndo`) | `useSwipeUndo.tsx` | Low — direction strings unchanged. |
| Match celebration modal exit animation | `MatchCelebrateModal.tsx` | Low — independent of card gesture. |
| Touch action / page scrolling | global `pan-y` policy (memory: Touch Gesture Prioritization) | **Highest risk.** The whole app currently sets `touch-action: pan-y` so the page can scroll vertically. The card must override to `touch-action: none` while dragging, otherwise the browser will steal the vertical gesture for page scroll. |
| Parallax / breathing effects on the photo | `useDeviceParallax.ts`, photo breathing 14s loop | Low. They read tilt/time, not drag. |
| Owner discovery screens (no card x-drag in some) | `OwnerSwipeContainer`, `SimpleOwnerSwipeCard` | Mirror the same change. |
| Chrome reveal taps (top/bottom edge strips) | `ChromeSummonZones.tsx` | Already isolated above the card. Confirm they still receive taps — they sit at higher z-index. |
| `data-no-swipe-nav` and route-level swipe-back gestures | `useSwipeNavigation.ts` | Low — those are for sideways navigation between pages, unrelated to card. |
| Card stack peek (next card visible underneath) | `SwipeCardPeek.tsx` | Medium. Currently scales next card based on top card's x distance. Switch to y distance. |
| Onboarding hint animations | hints showing "swipe right to like" | Copy and animation directions need to flip to "swipe up to like". |

## UX details to decide before building

1. **Tilt or no tilt on vertical drag?** Instagram-style is flat (no rotation). Tinder vertical apps usually keep a tiny ±4° tilt around horizontal axis. Recommendation: no rotation, slight scale-down as the card moves away — feels more "story-like".
2. **LIKE / NOPE labels** — top center for LIKE, bottom center for NOPE.
3. **Pull-down-to-exit grab area** — proposal: a thin invisible 64px strip at the very top of the card, plus the existing top header tap zone. Below that strip, vertical drag = like/pass.
4. **Velocity threshold** — keep current values (50px or 180px/s) but on y axis.
5. **Buttons** — keep visible, behavior identical.

## Out of scope

- The poker-hand category-picker dashboard cards keep their horizontal cycle gesture (`PokerCategoryCard.tsx`) because that is a different mental model (rotating through categories, not committing a like/pass).
- No backend/db changes.
- No analytics event renames.

## Rollout

One PR touching the four files: `SimpleSwipeCard.tsx`, `SimpleOwnerSwipeCard.tsx`, `usePullDownToDismiss.tsx`, `SwipeCardPeek.tsx`. Internal direction strings stay `'left' | 'right'` so nothing downstream changes.

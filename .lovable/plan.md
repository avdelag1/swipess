## Goal

Make the swipe deck respond to **both axes** with a clean, premium feel:

- **Swipe right** → LIKE (records to backend, may trigger match)
- **Swipe left** → PASS (records to backend)
- **Swipe up or down** → SKIP to next card (no backend write, just advance the deck)
- **Pull-down from the top ~110px** → still exits the deck back to the dashboard (existing curtain effect, unchanged)

This restores the classic Tinder horizontal mechanic the user is used to, while keeping vertical motion useful as a fast "next, next, next" browse gesture.

## Files to change

1. `src/components/SimpleSwipeCard.tsx`
2. `src/components/SimpleOwnerSwipeCard.tsx`
3. `src/components/swipe/GestureHints.tsx`
4. `src/components/swipe/usePullDownToDismiss.tsx` (no logic change — already restricted to top 110px, just confirm it still cooperates)

No backend, hook, or DB change. `useSwipe.tsx`, `useSwipeWithMatch.tsx`, the `likes` table, match logic, undo, sounds, analytics — all stay identical.

## Behavior spec

### Horizontal (like/pass — primary action)

- `drag` axis: free `x` and `y`, but **`x` is the committing axis**.
- Threshold: `|x| > 80px` OR `|velocityX| > 280 px/s` → commit.
- Direction: `x > 0` → `'right'` (LIKE), `x < 0` → `'left'` (PASS).
- Motion during drag: card translates in x, rotates up to ±14° (pivot from bottom), small y follow (×0.3) for natural feel, scale 1 → 0.96 near edges.
- LIKE label: top-right of card, fades in with rightward x (existing position style).
- NOPE label: top-left of card, fades in with leftward x.
- Exit animation: `animate(x, ±(window.innerWidth * 1.2), 0.28s, ease-out)`, then `onSwipe('right' | 'left')`.

### Vertical (skip — secondary action)

- Threshold: `|y| > 110px` OR `|velocityY| > 350 px/s`, AND `|y| > |x| * 1.4` (vertical lock so it doesn't fight horizontal).
- Both up and down map to a new `onSkip()` callback the parent already has access to (we'll pass it through). The parent simply advances `currentIndex` without writing to `likes`.
- Motion: card slides off in y-direction with `animate(y, ±viewportHeight, 0.26s)` and the next card scales up underneath (existing peek already handles this).
- Hint label: a soft "Next" pill briefly appears centered as the user pulls vertically (replaces the LIKE-up / NOPE-down indicators that were added in the previous iteration).

### Conflict resolution

- Direction is decided in `handleDragEnd`:
  1. If neither axis crossed threshold → spring back.
  2. Else, the axis with the **larger normalized progress** (`|offset| / threshold`) wins.
  3. If horizontal wins → call `onSwipe('right' | 'left')`.
  4. If vertical wins → call `onSkip()`.
- Pull-down-to-exit-deck (`usePullDownToDismiss`) keeps its existing 110px top-zone restriction, so it never collides with the card's vertical skip.

### Parent wiring (skip handler)

`SimpleSwipeCard` and `SimpleOwnerSwipeCard` get a new optional prop:
```ts
onSkip?: () => void;
```
Parent containers (`SwipessSwipeContainer`, owner equivalent) pass a function that:
- advances `currentIndex` by 1
- does **not** call `useSwipe()` mutation
- does **not** affect match/notification/undo state (skipped cards aren't undoable; that's intentional and matches user's "browse" mental model)

If `onSkip` is not provided, vertical gestures fall back to spring-back (no-op).

### Gesture hints (`GestureHints.tsx`)

Update the hint affordances to reflect the new model:
- **Left/right edge**: soft breathing chevrons (◂ / ▸) hinting horizontal like/pass — replaces the current right-edge vertical chevron.
- **Top center**: keep the small grab pill for pull-down-to-exit.
- **Bottom center**: a faint vertical chevron pair (˄ / ˅) breathing slowly to signal "swipe up/down to skip".
- All `pointer-events: none`, hidden when zoomed, hidden during drag (`opacity 0` while `isDragging`).

## Technical notes

- Restore `drag` to `true` (both axes) in both card components, instead of the current `drag="y"`.
- Restore `cardRotate = useTransform(x, [-200, 0, 200], [-MAX_ROTATION, 0, MAX_ROTATION])`.
- `likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])`, `passOpacity` from negative x (back to original Tinder mapping).
- New `skipOpacity = useTransform(y, [-110, 0, 110], [1, 0, 1])` for the brief "Next" pill.
- `handleButtonSwipe(direction)` reverts to flying horizontally: `animate(x, ±exitDistance, 0.28s)`.
- Exit animation duration kept at 280ms for snap; framer spring for snap-back uses existing `SILK` config (stiffness 500, damping 25, mass 0.4).
- `touch-action: none` on the card stays; `pan-y` policy remains for the rest of the app's vertical scroll surfaces.
- No changes to `useSwipeWithMatch`, `useSwipe`, `useSwipeUndo`, `MatchCelebrateModal`, `ChromeSummonZones`, parallax, or sounds.

## Out of scope

- No new analytics events (skip is not tracked yet — can be added later if desired).
- No undo for skipped cards.
- `PokerCategoryCard` (dashboard category fan) is unaffected.

## Rollout

Single change set across the four files listed above. After implementation I'll verify in preview that:
1. Horizontal swipe records like/pass and triggers match flow correctly.
2. Vertical swipe advances the deck without writing to `likes`.
3. Pull-down from the top still exits to dashboard.
4. Hints breathe softly and disappear during interaction.

Root cause: the quick-filter card component still uses horizontal-only dragging with rotation/scale transforms, while recent deck changes introduced competing gesture behavior and a build error on the owner card motion value typing. The result is that the category cards can feel stuck, partially loaded, or impossible to move naturally.

Plan:

1. Fix the current build error first
   - Update the owner swipe card motion value typing so `externalX` and `externalY` are typed as `MotionValue<number>` instead of `any`.
   - This resolves the `useTransform(y, ...)` TypeScript error where the value is inferred as `unknown`.

2. Rebuild quick-filter card gestures as strict axis movement
   - Update `PokerCategoryCard` so the top quick-filter card supports both vertical and horizontal gestures.
   - Add axis locking:
     - Vertical intent: card only moves on the Y axis.
     - Horizontal intent: card only moves on the X axis.
     - No diagonal/circular grabbing.
     - No rotation while dragging.
   - Lower the gesture threshold slightly so touch feels sensitive and immediate.

3. Make vertical swipes page through quick-filter cards
   - Swipe up or down will browse the category card stack only.
   - The current card will slide straight off-screen vertically and fade.
   - The next/previous card will rise into place from behind with a clean cinematic transition.
   - This will apply to both client quick-filter cards and owner quick-filter cards because both use `PokerCategoryCard`.

4. Keep horizontal swipes as quick category cycling
   - Swipe left/right will move the top quick-filter card straight left/right and cycle the deck.
   - The card will disappear immediately in a controlled straight line.
   - No like/dislike database action will be attached to quick-filter cards.

5. Improve card loading and sizing so they do not appear stuck or cut off
   - Adjust the quick-filter dashboard card frame sizing so it respects the available viewport height and bottom navigation.
   - Add safer width/height constraints for smaller preview/mobile heights.
   - Keep images mounted with a gradient fallback so a card never looks blank while the photo decodes.

6. Add subtle premium existence effects
   - Add faint breathing edge hints for vertical paging and horizontal cycling.
   - Add a soft depth shadow/glow to the top card and a cleaner layered stack behind it.
   - Keep the look minimal: visible enough to teach the gesture, almost invisible enough to stay luxury.

7. Verify both sides
   - Check client quick-filter dashboard card stack.
   - Check owner quick-filter dashboard card stack.
   - Confirm vertical movement is straight up/down only.
   - Confirm horizontal movement is straight left/right only.
   - Confirm selecting/engaging a category still opens the correct swipe deck.
   - Confirm the build error is gone.


## Plan: Restore Full Action Buttons & Fix Swipe Card Layout

### Build Errors (Fix First)

1. **`DashboardLayout.tsx` line 679**: Remove `onAISearchClick` prop — it doesn't exist on `TopBarProps`. The AI search logic needs to be handled differently (either add the prop to TopBarProps or remove the call).

2. **`useSwipe.tsx` line 124**: Duplicate `onError` property. The mutation has two `onError` handlers (line 42 for rollback, line 124 for toast). Merge them into one that does both rollback and toast.

### Swipe Card Layout Fixes

**Goal**: Cards fill full screen top-to-bottom. Info sits at ~60% from top. Action buttons float below info. Bottom nav stays at the very bottom. Nothing overlaps.

3. **`SimpleSwipeCard.tsx`** — Content overlay positioning:
   - Change `bottom: 'clamp(170px, 26vh, 220px)'` to `bottom: 'clamp(130px, 22vh, 180px)'` to move info lower and make room for buttons above nav.

4. **`SimpleOwnerSwipeCard.tsx`** — Same content overlay fix:
   - Same bottom adjustment for the info overlay positioning.

5. **All three containers** — Standardize button bar positioning:
   - **`SwipessSwipeContainer.tsx`** (client): Currently at `bottom: calc(var(--safe-bottom, 0px) + 148px)` — adjust to `calc(var(--safe-bottom, 0px) + 100px)` so buttons sit between info and bottom nav.
   - **`ClientSwipeContainer.tsx`** (owner): Same positioning fix.
   - **`RoommateMatching.tsx`**: Change from flow-based positioning to absolute positioning matching the other containers.

### Restore Missing Buttons

6. **`RoommateMatching.tsx`** — Add `onShare` and `onMessage` to `SwipeActionButtonBar`:
   - Add share handler and message handler.
   - Pass `onShare` and `onMessage` props to the button bar (currently only has like/dislike/undo).
   - Also add `onInsights` and middle-tap to the `SimpleOwnerSwipeCard` in roommate matching.

7. **All three sides already have the SwipeActionButtonBar with 5 buttons** (undo, dislike, share, like, message). Client and owner containers already pass all props. Only roommate is missing `onShare` and `onMessage`.

### Middle Tap → Insights

8. **Client side (`SwipessSwipeContainer.tsx`)**: Already passes `onInsights={handleInsights}` to `SimpleSwipeCard`, and `handleImageTap` already handles middle-third tap → `onInsights()`. This should work. Verify the `handleInsights` function opens the insights modal.

9. **Owner side (`ClientSwipeContainer.tsx`)**: Already passes `onInsights={() => handleInsights(topCard.user_id)}`. The `SimpleOwnerSwipeCard` already handles middle-third tap → `onInsights()`. Should work.

10. **Roommate side (`RoommateMatching.tsx`)**: Currently passes `onDetails` but NOT `onInsights`. Need to add `onInsights` handler that opens a profile/insights view. The `SimpleOwnerSwipeCard` has separate `onTap` and `onInsights` props — `onInsights` triggers on middle-third tap.

### Summary of Files to Edit

| File | Changes |
|------|---------|
| `src/components/DashboardLayout.tsx` | Remove `onAISearchClick` prop from TopBar |
| `src/hooks/useSwipe.tsx` | Merge duplicate `onError` handlers |
| `src/components/SimpleSwipeCard.tsx` | Adjust info overlay bottom position |
| `src/components/SimpleOwnerSwipeCard.tsx` | Adjust info overlay bottom position |
| `src/components/SwipessSwipeContainer.tsx` | Adjust button bar bottom position |
| `src/components/ClientSwipeContainer.tsx` | Adjust button bar bottom position |
| `src/pages/RoommateMatching.tsx` | Add share/message/insights to button bar, use absolute positioning for buttons, add onInsights to card |


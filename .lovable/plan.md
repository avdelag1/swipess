

## Fix Swipe Card Zoom (Magnifier) -- Client + Owner Side

### Problem 1: Zoom shows "small image" on client side
The magnifier hook finds the `<img>` element and applies `scale(2.8)` to it. But the image is wrapped inside a `<div>` with `overflow: hidden` (from the `CardImage` component), AND the container div also has `overflow-hidden`. So the zoomed image gets clipped by its parent -- it scales up but you can only see the original-size viewport of it, making it look like a weird small cropped image instead of a full zoom.

### Problem 2: Swipe gesture conflicts with zoom panning
When the user holds their finger to activate zoom then drags to pan, framer-motion's drag handler can intercept the pointer events before the magnifier's 350ms hold timer fires. This causes:
- Hold + slight movement triggers a drag instead of waiting for zoom
- Once zoomed, panning can accidentally trigger card movement

### Solution

**File: `src/hooks/useMagnifier.ts`** -- Fix overflow clipping during zoom

When the magnifier activates, walk up from the `<img>` element to the container and set `overflow: visible` on all intermediate wrapper divs. When deactivating, restore them to `overflow: hidden`. This ensures the scaled image isn't clipped by any parent.

Changes:
- Add a `savedOverflows` ref to store original overflow values
- In `activateMagnifier`: traverse parent elements from `<img>` up to `containerRef`, set each to `overflow: visible`
- In `deactivateMagnifier`: restore all saved overflow values
- Also set `overflow: visible` on the container itself during zoom

**File: `src/components/SimpleSwipeCard.tsx`** -- Better gesture timing for client cards

- Add a `gesturePhase` ref that tracks: `'idle' | 'pending' | 'zooming'`
- On pointer down, set phase to `'pending'` (waiting to see if it's a hold or a swipe)
- Use `dragListener={false}` and manually start drag only after determining it's a swipe (movement > 15px before hold timer fires)
- When magnifier activates (hold timer fires with no significant movement), set phase to `'zooming'` -- drag is completely blocked
- On pointer up, reset to `'idle'`

Simplified approach (less invasive): Keep `drag={!magnifierActive}` but also add `onDragStart` guard that cancels drag if hold timer is still pending and movement is minimal. Plus increase the movement threshold in magnifier from 25px to 15px so swipes are detected faster.

**File: `src/components/SimpleOwnerSwipeCard.tsx`** -- Same overflow fix applies

The owner side card has the same `CardImage` wrapper with `overflow: hidden`. Apply the identical overflow fix via the shared `useMagnifier` hook (no per-card changes needed for this part). Ensure the same gesture timing improvements are mirrored.

### Technical Details

**Overflow fix in `useMagnifier.ts`:**
```
activateMagnifier:
  1. Find img element
  2. Walk from img.parentElement up to containerRef.current
  3. For each element: save overflow style, set overflow = 'visible'
  4. Apply scale transform to img

deactivateMagnifier:
  1. Restore all saved overflow values
  2. Reset img transform to scale(1)
```

**Gesture timing in both swipe cards:**
```
handleDragStart:
  - If magnifier hold timer is pending (user held < 350ms but started moving):
    - If movement < 15px: cancel drag start (return false or set drag to false)
    - If movement > 15px: allow drag, cancel magnifier timer
  - If magnifier is active: block drag entirely
```

The key insight: The `useMagnifier` hook's `onPointerMove` already cancels the hold timer when movement exceeds 25px. Lowering this to 15px makes swipe detection faster, giving a crisper feel. Combined with `drag={!magnifierActive}`, the gesture separation becomes:

- Instant swipe (fast movement) -- magnifier timer cancelled immediately, drag proceeds
- Hold still 350ms -- magnifier activates, drag disabled, pan freely
- Slow drag that doesn't reach 15px in 350ms -- magnifier activates (rare edge case, acceptable)

### Files Modified
1. `src/hooks/useMagnifier.ts` -- overflow fix + lower movement threshold
2. `src/components/SimpleSwipeCard.tsx` -- drag start guard
3. `src/components/SimpleOwnerSwipeCard.tsx` -- drag start guard (mirror)


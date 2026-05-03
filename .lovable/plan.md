# Tinder-Style Swipe Card: Edges, Clean Zoom, Pan-While-Zoomed

Three precise issues to fix on `/client/dashboard` (and the equivalent owner deck):

1. The card currently fills the entire viewport edge-to-edge. You want it slightly inset so the rounded corners and a thin background "frame" are visible around it (Tinder feel).
2. When you press-and-hold to zoom, two ghost frames appear — a square frame (the card's outer rounded box / overflow being released) and a rectangle frame (the bottom Insights / info overlay).
3. While zoomed, dragging the finger does not reliably pan the photo.

---

## 1. Card sizing — let the background show through

**File:** `src/components/SwipessSwipeContainer.tsx` (deck wrapper, ~line 1118–1166)

The deck currently uses `absolute inset-0 w-full h-full sm:max-w-[480px]`. Replace the outer card-area wrapper so the card stack:
- Has horizontal padding (`px-3`) and a small top/bottom inset (`pt-2 pb-3`) on mobile.
- On larger viewports keeps `max-w-[440px]` and is centered.
- Uses `relative` instead of `absolute inset-0` for the card stack motion.div, with explicit `flex-1` and rounded inner area, so the parent background (white in light / black in dark) shows around the card edges.

Result: a visible 12–16 px gutter on the sides and a slim margin under the top bar / above the action buttons. The rounded card corners read as a real, floating object.

## 2. Clean zoom — hide every UI frame while pressed

**File:** `src/components/SimpleSwipeCard.tsx`

Currently `useMagnifier` walks up the DOM and sets `overflow: visible` on parents so the image can scale past the card. That removes the rounded clip and reveals the card's outer square + the bottom info overlay + gradients. Two changes:

a) Track `magnifierActive` as React state via the hook's existing `onActiveChange` callback. Pass `onActiveChange={setIsZoomed}` when calling `useMagnifier`.

b) When `isZoomed === true`, hide every visual chrome layer behind the image:
   - Top progress dots (`imageCount > 1` block)
   - Top + bottom cinema fades (lines 538–552)
   - In-card Share / Report buttons (line 577–608)
   - Bottom info overlay (`PropertyCardInfo` / `ClientCardInfo` block, line 696–791)
   - Bottom theme vignette (line 794–802)
   - Edge vignette / inset border (line 806–813)
   - Verified badge (line 816–825)
   - LIKE / NOPE stamps (already opacity-driven, but force opacity 0 too)

   Implementation: wrap each chrome element with `style={{ opacity: isZoomed ? 0 : undefined, transition: 'opacity 120ms' }}` (or a single conditional CSS class on the card root that fades children via `[data-zoomed=true] .chrome { opacity: 0; }`).

c) Keep the photo's rounded clipping intact during zoom. Instead of letting the magnifier hook strip `overflow: hidden` from ancestors, change the hook so it leaves the **image container's own** `rounded-[28px] overflow-hidden` alone and only widens overflow on the outer drag wrapper. The image stays inside the rounded card; the user just pans around the high-res content. This single change kills the square ghost frame entirely.

**File:** `src/hooks/useMagnifier.ts`

In `activateMagnifier`, stop walking up to `containerRef.parentElement.parentElement`. Walk up only to the immediate `containerRef.current` and stop. The image will scale within the card's own rounded clip, so no parent frame leaks.

## 3. Pan with finger while zoomed

The hook already supports this in `onPointerMove` (it calls `updateMagnifier` and `e.preventDefault()` while active). The reason panning currently feels broken is that **pointer capture is being requested on the wrong target** — `target` is set from `e.currentTarget` (the motion.div), but Framer Motion's drag system also attaches listeners that compete.

Fix in `SimpleSwipeCard.tsx` `handleUnifiedPointerMove` (line 279):
- When `isMagnifierActive()` returns true, call `e.stopPropagation()` and `e.preventDefault()` BEFORE delegating to `magnifierPointerHandlers.onPointerMove(e)`. This prevents Framer's drag listener from interpreting the same pointer move as a drag.
- Also gate `handlePointerMoveForTilt` so it does not run while zoomed.

Fix in `useMagnifier.ts` `onPointerDown`:
- Capture pointer immediately on `e.currentTarget` at the moment the hold timer fires (already done) — but also call `(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)` right at pointer down, so the same element receives all subsequent move events even before the 300 ms hold completes. This guarantees `onPointerMove` reaches the magnifier without being intercepted.

## Files to modify

- `src/components/SwipessSwipeContainer.tsx` — card stack wrapper sizing (gutters)
- `src/components/SimpleSwipeCard.tsx` — fade chrome layers when zoomed; harden pointer routing during zoom
- `src/hooks/useMagnifier.ts` — limit overflow walk to the image container; aggressive pointer capture

No other files, no DB changes, no routing changes.

## Visual outcome

```text
┌─────────────────────────────┐
│   [<] [persona]   [☀][🔔]   │  ← top bar
│                             │
│   ╭───────────────────────╮ │  ← card with visible 12px gutter
│   │                       │ │
│   │      LISTING PHOTO    │ │
│   │                       │ │
│   │   $35,000  /night     │ │
│   ╰───────────────────────╯ │
│                             │
│   ↩  👎  💬  🔥  📱         │  ← action bar
│ DASH  PROFILE  LIKES …      │  ← bottom nav
└─────────────────────────────┘
```

When you press and hold:
- All overlays (price card, gradients, badges, side buttons, progress dots) fade to 0 in ~120 ms.
- The photo fills the rounded card with `scale: 2.8`.
- Moving your finger pans the zoomed photo smoothly until you release.
- On release, overlays fade back in.

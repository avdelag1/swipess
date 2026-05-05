## Goal

Two changes on the swipe dashboards (client + owner):

1. **Tighten the action button row** (Return, Dislike, Message, Like, Insights) so the icons sit visually closer together — no oversized invisible tap squares pushing them apart.
2. **Auto-hide the TopBar + BottomNav while interacting with a swipe card.** Reveal them only on an intentional gesture (tap top edge or tap bottom edge of the screen), then auto-hide again after 5s of no interaction. Apple-style fade.

---

## 1. Tighter action buttons (`src/components/SwipeActionButtonBar.tsx`)

The buttons feel spread out because each one is a wide square. Shrink the hit-box to a tight circle around the icon and remove extra row spacing.

- Replace the square dimensions with circular ones:
  - Large (Like / Dislike): `56px` (was up to 78px)
  - Small (Return / Message / Insights): `40px` (was up to 50px)
  - Icons resized proportionally: large `30px`, small `20px`
- Add `borderRadius: '50%'` so the tap target is a true circle, not a square.
- Row gap reduced: `gap-0` between buttons (icons themselves already have built-in padding via the drop-shadow). The `-mt-6` lift stays.
- Keep haptics, glow, lottie animations untouched.

Result: icons sit close together like Tinder/Bumble, no dead space between.

---

## 2. Auto-hide chrome on swipe dashboards

Today `SwipessHud` has `alwaysVisible={isSwipeDashboard}` for both top and bottom — meaning chrome is permanently shown on `/client/dashboard` and `/owner/dashboard`. We'll flip that behavior to **hidden by default** on those routes and add a "summon" mechanism.

### New hook: `src/hooks/useChromeReveal.ts`

A lightweight Zustand-free module (just a tiny event bus + hook) that exposes:

```text
isChromeVisible: boolean      // false by default on swipe dashboards
revealChrome():  void         // shows chrome, starts 5s auto-hide timer
hideChrome():    void
```

Behavior:
- Calling `revealChrome()` shows chrome, resets a 5000ms timer, then auto-hides.
- Re-tapping during the 5s window resets the timer (doesn't toggle off).
- Default state on mount = hidden (only on swipe dashboards).

### Wire `SwipessHud` to it

Add a new prop `revealMode?: boolean`. When true, `SwipessHud` ignores `alwaysVisible`/`isScrollVisible` and instead uses `useChromeReveal().isChromeVisible`. Existing transition classes (opacity + translate-y) already give the smooth Apple-style slide.

In `AppLayout.tsx`:
- Replace `alwaysVisible={isSwipeDashboard}` with `revealMode={isSwipeDashboard}` for both top and bottom `SwipessHud` instances.

### Summon zones (new component): `src/components/swipe/ChromeSummonZones.tsx`

Two thin invisible strips rendered only on swipe dashboards:

```text
┌──────────────────────────────┐
│  TOP STRIP  (24px tall)      │  ← tap reveals TopBar+BottomNav
├──────────────────────────────┤
│                              │
│       SWIPE CARD AREA        │
│                              │
├──────────────────────────────┤
│ BOTTOM CENTER STRIP (24×40%) │  ← tap reveals chrome
└──────────────────────────────┘
```

- `position: fixed`, `z-index: 10004` (just under chrome's 10005).
- `pointer-events: auto` only on the strips themselves.
- `onClick={revealChrome}` + light haptic.
- The strips are **completely transparent** — no visual.
- They sit **outside** the card drag area so they never interfere with swipe / zoom / photo-tap.

Mounted from `AppLayout.tsx` only when `isSwipeDashboard && !showAIChat`.

### Why this is safe with existing gestures

The card itself owns the entire middle of the screen for swipe / zoom / left-right photo tap. The summon strips are 24px slivers at the very top and bottom-center, **above** the chrome z-index but below the chrome itself. They never overlap the card body, so swiping, holding-to-zoom, and tapping the photo for insights all continue to work without revealing chrome accidentally.

When chrome IS revealed, the chrome (`z-10005`) sits above the strips and receives the taps normally.

### 5-second auto-hide

The `useChromeReveal` hook's internal `setTimeout(5000)` handles this. Any interaction inside the chrome itself (tapping a header button, etc.) calls `revealChrome()` again to reset the timer so the user isn't cut off mid-action.

---

## Files touched

- `src/components/SwipeActionButtonBar.tsx` — circular, tighter buttons
- `src/components/SwipessHud.tsx` — add `revealMode` prop
- `src/components/AppLayout.tsx` — switch swipe dashboards to `revealMode`, mount summon zones
- `src/hooks/useChromeReveal.ts` — new (event-bus + hook + 5s timer)
- `src/components/swipe/ChromeSummonZones.tsx` — new (top + bottom-center invisible tap strips)

No backend changes. No DB changes. No changes to swipe physics, photo tap, zoom, or like/dismiss logic.

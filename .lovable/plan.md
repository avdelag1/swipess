# Swipe deck UX fixes

Four small but interlocking fixes on the swipe dashboard.

## 1. Photo dots indicator — remove the shaded pill

`src/components/swipe/PhotoPositionIndicators.tsx` currently wraps the dots in a frosted pill (`border`, `bg-background/45`, `backdrop-blur-xl`, inset shadow). Strip the pill so only the dots float over the photo. Keep the dot styling (active = wider/glow, inactive = small/dim) and add a soft text-shadow on each dot for legibility on bright photos.

## 2. Hidden chrome must be truly inert (the real bug)

Right now `SwipessHud` only fades / translates its children when `isChromeVisible` is false. The TopBar and BottomNavigation DOM stays mounted with `pointer-events: auto` on inner buttons, so tapping the top-left of the screen still hits the back/menu button and tapping the bottom-left still hits the navigation, but visually the user sees nothing — exactly what they're describing ("the actions are still there, you just made the icons disappear").

Fix in `src/components/SwipessHud.tsx`:
- When `revealMode === true && !isVisible`, also apply `pointer-events: none !important` on the children wrapper AND set `visibility: hidden` after the fade transition (use `aria-hidden`, `inert` attribute, and `pointerEvents: 'none'` inline) so the buttons can't be tapped.
- When visible, restore `pointer-events: auto` on the inner shell so the real TopBar/BottomNavigation buttons work.

This single change is what makes "tap top edge / bottom edge to summon" actually feel right — currently the floating VoiceConcierge (left) and RadioMiniPlayer (right) plus the invisible BottomNavigation absorb the tap before `ChromeSummonZones` ever sees it.

Also in `AppLayout.tsx` on swipe dashboards: hide `VoiceConciergeButton` and `RadioMiniPlayer` while chrome is hidden (subscribe to `useChromeReveal`) so left/right edge taps don't open AI chat or radio. They reappear together with the chrome.

## 3. Raise summon-zone priority

`ChromeSummonZones` sits at `z-index: 10004`, just below the hidden HUD wrappers (`10005`). Since the hidden HUDs will now be `pointer-events: none`, the zones will receive taps. Also widen the bottom strip from `30%–70%` to `15%–85%` so it's easier to hit, and bump heights to ~28px so the user doesn't need surgical precision.

## 4. Remove middle-tap → Insights on the card

In `src/components/SimpleSwipeCard.tsx` `handleImageTap`, drop the `else if (onInsights) { onInsights() }` branch. Middle taps now do nothing (Insights is reachable via the action button as before). Apply the same change in `src/components/SimpleOwnerSwipeCard.tsx` if it has the equivalent handler.

## 5. Persistent back arrow on the swipe deck

Add a small floating back button at the top-left corner of the swipe-card area (inside the deck region, NOT in the TopBar — so it stays visible even when chrome is hidden). It navigates to the main dashboard (`/client/dashboard` or `/owner/dashboard` based on active mode).

Implementation: new component `src/components/swipe/SwipeDeckBackButton.tsx` — a 36px circular glass chip with a `ChevronLeft` icon, positioned `absolute top-[calc(var(--safe-top,0px)+12px)] left-3 z-[60]`, `pointer-events-auto`. Mount it inside the swipe deck containers (Client + Owner dashboard pages) above the card stack. Background: `bg-black/30 backdrop-blur-md border border-white/15`, icon white. Tapping it calls `navigate(/${activeMode}/dashboard)`.

## Files touched

- `src/components/swipe/PhotoPositionIndicators.tsx` — remove pill background
- `src/components/SwipessHud.tsx` — add `pointer-events: none` + `inert` + `visibility` when hidden in revealMode
- `src/components/AppLayout.tsx` — hide VoiceConcierge + RadioMiniPlayer when chrome hidden on swipe dashboard
- `src/components/swipe/ChromeSummonZones.tsx` — wider/taller bottom zone
- `src/components/SimpleSwipeCard.tsx` — drop middle-tap insights
- `src/components/SimpleOwnerSwipeCard.tsx` — same, if applicable
- `src/components/swipe/SwipeDeckBackButton.tsx` — new
- `src/pages/ClientDashboard.tsx` + `src/pages/EnhancedOwnerDashboard.tsx` — mount the back button inside the deck region

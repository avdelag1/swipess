## Goal

Strip the redundant rectangular/pill backgrounds from the header (TopBar) buttons and the bottom navigation bar so the icons sit on the existing app glass surface without a second framed layer behind them.

## What's there today

- **`src/components/TopBar.tsx`** — Every header control (back, profile, tokens/Crown, theme, notifications) is wrapped in a `glassPillStyle` rounded pill: `background hsl(var(--card)/0.52)`, blur 28px, border, drop shadow, and a 36px height. The Crown button additionally layers a primary→accent gradient frame. This produces the visible rectangle/pill background per button.
- **`src/components/ThemeToggle.tsx`** and **`src/components/NotificationPopover.tsx`** receive that same `glassPillStyle` from TopBar and render their trigger inside it.
- **`src/components/BottomNavigation.tsx`** — Wraps the entire item row in a glass container (`glass-pill-nav`, white/dark fill, 32px blur, border, shadow, 3rem radius). Individual items are transparent unless active; the visible frame is this outer container.
- **`src/components/ModeSwitcher.tsx`** — Already a single connected glass pill (kept as-is per recent work).

## Changes

### 1. TopBar — remove per-button pill frames

In `src/components/TopBar.tsx`:

- Replace `glassPillStyle` with a frame-less `iconButtonStyle`: no `background`, no `border`, no `boxShadow`, no `backdropFilter`. Keep only sizing (36×36), centering, color, and the tap transition. This makes each control a clean floating icon.
- Apply this style to the back button, profile chip, and Crown/Tokens button. For the Crown button, drop the gradient/border overlay and the inner top highlight `<span>`; render the Crown icon alone with its existing color/drop-shadow so it still reads as the "premium" accent without a frame.
- Pass the same frameless style down to `<ThemeToggle glassPillStyle={...} />` and `<NotificationPopover glassPillStyle={...} />` (prop name kept for compatibility) so their triggers also lose the pill background. The notification badge dot stays.
- Profile button: keep the circular avatar (it's the avatar itself, not a frame), but remove the surrounding pill `background`/`border`/`boxShadow`. The name chip text stays inline next to the avatar.

### 2. BottomNavigation — remove outer rectangle frame

In `src/components/BottomNavigation.tsx`:

- On the wrapper `<div className="pointer-events-auto glass-pill-nav …">`, drop the inline `background`, `border`, `boxShadow`, `backdropFilter`/`WebkitBackdropFilter`, and the rounded-3rem visible fill. Keep the layout (`padding`, `width`, centering) so item spacing is unchanged.
- Remove the `glass-pill-nav` class from this element to prevent the CSS-defined glass surface from re-introducing the frame. (We leave the class definition alone in case it's used elsewhere — quick `rg` confirmation will be done at edit time; if unused we can also delete the rule.)
- Active-item treatment stays: the `layoutId="bottomNavActivePill"` highlight remains so the selected tab still gets its subtle gradient pill. That's the per-button glass the user referred to as "already there".
- No changes to icons, labels, scroll behavior, haptics, or routing.

### 3. Touch / safe-area preservation

- Keep `paddingBottom: calc(8px + env(safe-area-inset-bottom))` on the nav so the bar still clears the home indicator.
- Keep TopBar `paddingTop: calc(var(--safe-top) + 6px)` and the 36px touch targets, so accessibility/tap area is unchanged.

## Files touched

- `src/components/TopBar.tsx`
- `src/components/ThemeToggle.tsx` (only if its internal styling re-applies a frame — verified at edit time)
- `src/components/NotificationPopover.tsx` (same caveat)
- `src/components/BottomNavigation.tsx`

## Out of scope

- ModeSwitcher (already unified).
- Any logic, routing, swipe physics, or filter behavior.
- Color tokens / theme variables.

## Verification

After implementation: header shows icons floating on the page background with no per-button pills; bottom nav shows the row of icons with only the active item highlighted, no outer rectangle. Light + dark mode both checked. Active route highlight, badges, and haptics still fire.
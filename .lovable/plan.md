

## Plan: Fix White Theme Rendering + Bottom Navigation Polish

### Problem 1: White theme looks dark
The `ThemeProvider` defaults to `'black-matte'` and only loads the user's preference after login. On the landing page (unauthenticated), it always shows dark. When you select white-matte, the `--background` CSS variable correctly sets to `0 0% 96%` (near-white), but several components use hardcoded dark colors in their inline styles that override the theme.

**Fix in `src/components/BottomNavigation.tsx`:**
- Dark mode pill backgrounds (`rgba(24, 24, 27, 0.8)` and `rgba(39, 39, 42, 0.95)`) are hardcoded and show dark pills on a white page
- In light mode, the pills use `rgba(0, 0, 0, 0.08)` which is correct but the border `rgba(0, 0, 0, 0.12)` creates visible dark outlines
- Fix: Make light-mode buttons fully transparent with no border (matching the "floating, borderless" design memory), and keep dark-mode pills as-is

### Problem 2: Bottom nav doesn't fit the white aesthetic
The current bottom nav uses individual pill containers per button with backgrounds, borders, and shadows. In white-matte mode, these pills create visual clutter against the clean white background.

**Fix approach:**
- Light mode: Remove individual button backgrounds, borders, and shadows entirely — icons and labels float cleanly on white
- Dark mode: Keep the current frosted glass pill style (it works well on dark)
- Both modes: Keep the active indicator dot and gradient icons for the active state

### Files to change
1. **`src/components/BottomNavigation.tsx`** — Conditionally remove backgrounds/borders/shadows for light mode buttons. The style block at lines 168-178 will be updated to set `bgDefault`, `bgActive`, `borderColor`, and `shadowColor` to transparent values in light mode.

### Scope
- Single file edit (BottomNavigation.tsx)
- Only visual changes — no logic, routing, or structural changes
- Preserves all dark-mode styling


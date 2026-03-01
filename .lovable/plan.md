

## Plan: Fix Low-Contrast Text/Icons in White Theme

The screenshot shows the bottom navigation icons and labels are barely visible against the white background — they use `rgba(0,0,0,0.06)` backgrounds and `0.7` opacity labels which wash out in light mode.

### 1. Fix BottomNavigation icon/label contrast for white-matte
**File:** `src/components/BottomNavigation.tsx` (lines 168-177, 253-262)

Changes to theme-aware color variables:
- `iconColor` light: increase from `0.85` opacity to `1.0` → full black icons
- `bgDefault` light: increase from `rgba(0,0,0,0.06)` to `rgba(0,0,0,0.08)` — slightly more visible pill bg
- `bgActive` light: increase from `rgba(0,0,0,0.10)` to `rgba(0,0,0,0.14)`
- `borderColor` light: keep as-is (already 1.0)
- Label opacity for inactive items (line ~260): change from `0.7` to `0.85` in light mode
- Inactive icon `strokeWidth`: already 3, fine

### 2. Audit TopBar button contrast
**File:** `src/components/TopBar.tsx`
- Verify "TOKENS", "QUICK FILTER", notification bell text/icons use `text-foreground` not hardcoded light colors
- The tier config (lines 26-47) uses hardcoded dark-theme colors like `text-purple-300` — these need light-mode variants

### 3. Global text contrast safety net
**File:** `src/components/TopBar.tsx`
- Ensure popover content, mode switcher labels, and header text all use semantic `text-foreground` / `text-muted-foreground` tokens that resolve to dark colors in white-matte

### Technical scope
- Only color/opacity values change — no layout, no structure, no routing changes
- All changes are conditional on `isLight` flag so dark themes remain untouched


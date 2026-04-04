

# Fix Radio, Add Owner Card Photos, Fix Logo/Icons

## Issues Identified

1. **Radio can't be opened**: The radio page renders at `z-50` as a fixed overlay, but the `AppLayout` or parent containers may clip it. The real problem: radio is inside `PersistentDashboardLayout` which has its own scroll container and layout constraints — the `fixed inset-0 z-50` fights with the layout wrapper. Also, the `isPoweredOn` state defaults to `false` and the radio page doesn't auto-power-on when navigated to directly.

2. **Owner quick filter cards have no photos**: `POKER_CARD_PHOTOS` references `owner_buyers_card.png`, `owner_renters_card.png`, `owner_hire_card.png` — none of these files exist in `/public/images/filters/`. Cards fall back to gradient-only display.

3. **Logo/favicon is an ugly dark square**: The previous AI generated PWA icons (icon-192.png, icon-512.png, favicon.png, apple-touch-icon.png, etc.) as near-solid dark (#0A0A0B) squares with a barely visible 10px-wide white "S". The user wants the actual SwipesS wordmark logo used on the landing page to appear on the splash screen, loading screen, and as favicons/PWA icons.

---

## Plan

### Task 1: Fix Radio Page

**Problem**: When navigating to `/radio`, the `DJTurntableRadio` component renders inside `PersistentDashboardLayout` but uses `fixed inset-0 z-50` which conflicts with the layout's overflow and z-index stacking. Additionally, if `isPoweredOn` is false, the radio should still render the full UI (it's a page, not a mini-player).

**Fix**:
- In `DJTurntableRadio.tsx`: Add a `useEffect` that auto-powers-on the radio when the page mounts (call `togglePower()` if `!state.isPoweredOn`). This ensures visiting `/radio` always shows the functional radio.
- Verify the `fixed inset-0 z-50` renders above the layout — may need to bump z-index or ensure the layout parent doesn't have `overflow: hidden` clipping it.

### Task 2: Generate Owner Card Photos

**Problem**: Three images are missing: `owner_buyers_card.png`, `owner_renters_card.png`, `owner_hire_card.png`.

**Fix**:
- Generate 3 premium placeholder images (programmatically via Python/Pillow) with bold gradients and text overlays matching each intent:
  - **Buyers** (blue gradient, house icon feel)
  - **Renters** (green gradient, key/apartment feel) 
  - **Hire** (purple gradient, professional/briefcase feel)
- Save to `public/images/filters/` so the existing `POKER_CARD_PHOTOS` references resolve correctly.
- Each image: 600x800px, modern gradient backgrounds with white text labels.

### Task 3: Regenerate Logo/Favicon/PWA Icons

**Problem**: Current icons are a dark square with an almost invisible white letter. User wants the SwipesS wordmark logo (the orange gradient one used on the main page with the `swipess-wordmark-512.png` mask) to be visible and recognizable.

**Fix**:
- Regenerate all icon sizes using a proper design:
  - Dark background (#0A0A0B) with the SwipesS "S" rendered large and bold in the brand orange gradient (#ff4d00 → #ff6b35)
  - The "S" should fill ~60-70% of the icon area (not a tiny 10px mark)
  - Generate: favicon.png (48px), icon-16/32/48/96/144/192/512/1024.png, apple-touch-icon.png (180px), maskable-192/512.png
- Update `swipess-wordmark-512.png` if needed (this is used as a CSS mask for the splash screen logo — needs to be a proper wordmark shape, not a filled square)
- The splash screen in `index.html` already uses CSS mask with this file — just need the image to be correct

### Files Modified

| File | Change |
|------|--------|
| `src/pages/DJTurntableRadio.tsx` | Auto-power-on radio on page mount |
| `public/images/filters/owner_buyers_card.png` | New — generated placeholder |
| `public/images/filters/owner_renters_card.png` | New — generated placeholder |
| `public/images/filters/owner_hire_card.png` | New — generated placeholder |
| `public/favicon.png` | Regenerated with visible orange S |
| `public/icons/icon-*.png` (all sizes) | Regenerated with visible orange S |
| `public/icons/apple-touch-icon*.png` | Regenerated with visible orange S |
| `public/icons/maskable-*.png` | Regenerated with visible orange S |


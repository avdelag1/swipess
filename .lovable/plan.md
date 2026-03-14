

## Plan: Black splash screen + verify white theme in filters + confirm photo upload limits

### 1. Splash screen → black background

**`index.html`** line 31: Change `background: #ffffff` → `background: #000000`

This makes the initial loading screen black while the app itself stays white (light theme) once React mounts.

### 2. Ensure white theme works inside filter pages

The filter pages (`ClientFilters.tsx`, `OwnerFilters.tsx`, `OwnerFiltersExplore.tsx`) already use `useTheme()` and apply `isLight` conditionals. The light theme CSS variables in `matte-themes.css` already define white backgrounds. No changes needed here — the white theme already propagates into these pages via the CSS variable system.

### 3. Confirm photo upload limits are correct

- **Profile** (`ClientProfileDialog.tsx`): Already `maxPhotos={1}` — confirmed at line 398. No change needed.
- **Listings** (`UnifiedListingForm.tsx`): Already `getMaxPhotos()` returns `1` — confirmed at line 77. However, `input.multiple = true` at line 320 should be changed to `input.multiple = false` to prevent the file picker from allowing multi-select (even though the code truncates, the UX is confusing).

### Files to edit (2 total)

| File | Change |
|------|--------|
| `index.html` | Splash background → `#000000` |
| `src/components/UnifiedListingForm.tsx` | `input.multiple = false` (line 320) |


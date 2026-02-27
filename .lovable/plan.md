

## Plan: Fix Build Errors, Remove "Get Started" Button, Fix White Theme, Fix Mini Radio Persistence

### 1. Fix build error: `BottomNavigation.tsx` — missing `isLight` variable
Add `const isLight = theme === 'white-matte';` after the existing `useTheme()` call (line 19 imports `useTheme`, but `isLight` is never derived from it). Need to check if `theme` is destructured from `useTheme()`.

Looking at the imports, `useTheme` is imported at line 19. Need to add the `isLight` derivation after the theme hook usage inside the component body.

### 2. Fix build error: `SwipeActionButtonBar.tsx` — missing `useTheme` import
Add `import { useTheme } from '@/hooks/useTheme';` to the imports (line 25-28 area).

### 3. Fix build error: `button.tsx` — duplicate `motion` import and duplicate `asChild` block
- Remove the duplicate `import { motion } from "framer-motion"` on line 8
- Remove the duplicate `if (asChild)` block (lines 81-90) which references undefined `handleClick`

### 4. Fix build error: `RadarSearchEffect.tsx` — missing `AnimatePresence` import
Add `AnimatePresence` to the framer-motion import statement.

### 5. Fix build error: `ClientWhoLikedYou.tsx` — duplicate `images` property
Remove the duplicate `images` property at line 78 (keep line 83).

### 6. Fix build error: `OwnerSettingsNew.tsx` — duplicate `Badge` import
Remove the duplicate `import { Badge }` at line 14.

### 7. Remove "Get Started" button from landing page
Remove the "Direct Entry Button" section in `LegendaryLandingPage.tsx` (lines 154-179), keeping only the swipeable logo and tagline as entry points.

### 8. Fix white theme "filter" haze
The `GradientMasks.tsx` component applies gradient overlays even in light mode. The `lightDim` multiplier of `0.08` still creates a visible haze with white gradients (`255,255,255`). For the white-matte theme, these should be fully disabled (set `lightDim` to `0` or skip rendering when `light` is true).

### 9. Fix mini radio player persistence after close
Currently in `RadioMiniPlayer.tsx`, the player checks `state.miniPlayerMode === 'closed'` to hide, but `togglePower` in `RadioContext.tsx` doesn't set `miniPlayerMode` to `'closed'`. The power button in the mini player sets `isPoweredOn = false`, which hides it, but when the user opens the radio page again it auto-powers on.

The fix: When the user explicitly closes/powers off the mini player, set `miniPlayerMode` to `'closed'`. Only reset it back to `'expanded'` when the user navigates to the radio station page and interacts with it (plays a station). Currently `togglePower` in RadioContext just toggles power without touching `miniPlayerMode`. We need to update the mini player's power button handler to call `setMiniPlayerMode('closed')` instead of `togglePower`, so it stays closed until the user opens the radio page again.

### Technical Details

**Files to modify:**
- `src/components/BottomNavigation.tsx` — add `const { theme } = useTheme(); const isLight = theme === 'white-matte';` in component body
- `src/components/SwipeActionButtonBar.tsx` — add `useTheme` import
- `src/components/ui/button.tsx` — remove duplicate import and duplicate asChild block
- `src/components/ui/RadarSearchEffect.tsx` — add `AnimatePresence` to import
- `src/pages/ClientWhoLikedYou.tsx` — remove duplicate `images` property
- `src/pages/OwnerSettingsNew.tsx` — remove duplicate `Badge` import
- `src/components/LegendaryLandingPage.tsx` — remove Get Started button block
- `src/components/ui/GradientMasks.tsx` — disable gradients entirely for light theme (return null or set opacity to 0)
- `src/components/RadioMiniPlayer.tsx` — change power button to call `setMiniPlayerMode('closed')` and pause audio
- `src/contexts/RadioContext.tsx` — reset `miniPlayerMode` to `'expanded'` only when user plays from radio page


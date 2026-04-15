

## Add Sunset (Red) Theme Filter

A new "Sunset" theme option alongside the existing Light and Dark filters. It uses the already-existing `red-matte` CSS tokens to create a warm, deep-red aesthetic. The theme toggle cycles through all three: Light, Dark, Sunset.

### Changes

**1. Update `src/hooks/useTheme.tsx`**
- Add `'sunset'` to the `Theme` type: `'dark' | 'light' | 'cheers' | 'sunset'`
- In `normalizeTheme()`, map `'red-matte'` and `'sunset'` to `'sunset'`
- In `applyThemeToDOM()`, when theme is `'sunset'`: add both `'dark'` and `'red-matte'` classes, set `colorScheme: 'dark'`, theme-color meta to `#1a0505`
- Update `_VALID_THEMES` to include `'sunset'`

**2. Update `src/components/ThemeToggle.tsx`**
- Change cycling logic: `light -> dark -> sunset -> light`
- Add a third icon state using `Sunset` from lucide-react (the icon exists) for the sunset theme, rendered in a warm coral/orange color (`text-orange-400`)
- Update aria labels to include "Sunset" option

**3. Refine `red-matte` CSS in `src/styles/matte-themes.css`**
- Adjust the existing `red-matte` tokens slightly toward warmer sunset tones (shift hue from pure 0 toward 8-12 for a more orange-red feel, less aggressive)
- Add a subtle CSS keyframe `@keyframes sunset-glow` that creates a very faint warm pulse on the background every ~12 seconds
- Apply the glow animation to `.red-matte` body/root via a pseudo-element or CSS variable

**4. Update `src/components/LegendaryLandingPage.tsx`**
- Update `toggleTheme` to cycle through all 3 themes instead of just light/dark

### Files
- **Edit:** `src/hooks/useTheme.tsx`, `src/components/ThemeToggle.tsx`, `src/styles/matte-themes.css`, `src/components/LegendaryLandingPage.tsx`

### Result
Users get a third theme option -- a warm, cinematic red filter that feels premium and iOS-native. The toggle smoothly cycles Light (Sun) -> Dark (Moon) -> Sunset (Sunset icon) with the same view-transition animation.


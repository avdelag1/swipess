

## Plan: Restore theme toggle + fix light/dark theme consistency

### Root Cause Analysis

Three interconnected problems:

1. **ThemeToggle removed from TopBar** — user can't switch themes anymore
2. **`normalizeTheme` hardcoded to `'light'`** — dark theme is impossible even if toggled
3. **`:root` CSS defaults are dark-first** — lines 380-397 in `index.css` set black background/white foreground inside `@layer base`. When light `.light` class applies, it overrides correctly, but the dark defaults flash briefly and cause confusion
4. **Hardcoded dark colors** — components like `ClientSwipeContainer`, `MessageActivationPackages`, `QuickFilterDropdown` use `bg-black/60`, `text-white` etc. that don't adapt to theme

### Changes

#### 1. `src/hooks/useTheme.tsx` — Un-hardcode `normalizeTheme`
Make it actually respect both 'light' and 'dark':
```typescript
function normalizeTheme(raw: string | null | undefined): Theme {
  if (raw === 'dark' || raw === 'black-matte' || raw === 'grey-matte') return 'dark';
  return 'light'; // Default to light for everything else
}
```

#### 2. `src/components/TopBar.tsx` — Add ThemeToggle back
Import and render `<ThemeToggle />` in the right action buttons section (next to notifications bell).

#### 3. `src/index.css` — Fix `:root` defaults to be light-first
Change the `:root` defaults inside `@layer base` (lines 380-397) from dark values to light values, so the app doesn't flash black on initial load:
```css
--background: 0 0% 100%;
--foreground: 0 0% 7%;
--card: 0 0% 99%;
/* etc — matching .light values */
```
The `.dark` class will properly override these when dark theme is active.

#### 4. Key component fixes for theme-awareness
- **`ClientSwipeContainer.tsx`** line 731: `bg-black/60` skeleton → keep as-is (overlay on card image, appropriate in both themes)
- **`MessageActivationPackages.tsx`**: Replace `isDark ? "bg-black" : "bg-gray-50"` and similar ternaries — these already work since `isDark` will be false in light mode
- **`QuickFilterDropdown.tsx`** line 418: `bg-black/70` backdrop → `bg-black/50` (backdrop overlay, works in both themes)

#### 5. `src/components/AppLayout.tsx` — Make gradient masks theme-aware
Currently gradient masks (vignette, top/bottom) only render for dark themes. They should render for both but with `light={true}` for light theme.

### Files to edit (4 files)

| File | Change |
|------|--------|
| `src/hooks/useTheme.tsx` | Un-hardcode normalizeTheme to support light+dark |
| `src/components/TopBar.tsx` | Add `<ThemeToggle />` back to right action section |
| `src/index.css` | Change `:root` defaults from dark to light |
| `src/components/AppLayout.tsx` | Render gradient masks for both themes |


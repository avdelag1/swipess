

## Plan: Remove white-matte theme, fix filter page scroll behavior, then recreate a clean white theme

### What's wrong

1. **White-matte theme is broken across the app** — hundreds of `.white-matte` CSS overrides, inline style conditionals (`theme === 'white-matte'`), and override files (`theme-overrides.css`) create a fragile, inconsistent experience. The user wants it completely removed first.

2. **Filter pages don't hide TopBar/BottomNav on scroll** — The filter pages (`/client/filters`, `/owner/filters`, `/owner/filters-explore`) are rendered inside `PersistentDashboardLayout`, which wraps them with `TopBar` (hideOnScroll=true) and `BottomNavigation`. The scroll-hide already works via `useScrollDirection` targeting `#dashboard-scroll-container`. However, the filter pages have their own sticky headers that overlap with the TopBar, and the BottomNavigation may not be hiding because the filter pages use their own `ScrollArea` instead of the main scroll container.

3. **Text/color mismatches** — Various hardcoded color references (e.g., `text-white`, `bg-black`) that were overridden by `.white-matte` CSS rules will need cleanup once the white theme is recreated properly.

---

### Implementation

#### Phase 1: Set dark theme as default, remove white-matte references

**Files to change:**

- **`src/hooks/useTheme.tsx`**
  - Change `Theme` type to just `'dark' | 'light'` (simpler naming)
  - Set `DEFAULT_THEME` to `'dark'` (was `'white-matte'`)
  - Update valid themes list and class toggling logic
  - Keep the `setTheme` save-to-DB flow intact

- **`src/styles/theme-overrides.css`** — Delete the entire file (397 lines of `.white-matte` overrides)

- **`src/styles/matte-themes.css`** — Remove the `.white-matte` block (lines 96-137). Keep `.black-matte` and other dark themes.

- **`src/index.css`** — Remove all `.white-matte` specific rules (the forced white backgrounds, text overrides, header transparency overrides)

- **~39 component files** — Replace `theme === 'white-matte'` / `theme !== 'white-matte'` checks with the new theme value check (`theme === 'light'` / `theme === 'dark'`). This is a mechanical find-and-replace across all files that reference `white-matte`.

#### Phase 2: Fix filter page scroll hide/show for TopBar and BottomNav

**Root cause:** Filter pages use their own `<ScrollArea>` component which creates a separate scroll container. The `useScrollDirection` hook listens to `#dashboard-scroll-container` but the filter pages' content scrolls inside their own `ScrollArea`, not the dashboard container. So the TopBar and BottomNav never detect scrolling on filter pages.

**Fix approach:**
- **`src/pages/ClientFilters.tsx`** — Replace the internal `<ScrollArea>` with a regular `<div>` so content scrolls within the parent `#dashboard-scroll-container`. This allows `useScrollDirection` to detect scroll and hide/show TopBar + BottomNav naturally.
- **`src/pages/OwnerFiltersExplore.tsx`** — Same fix: remove `<ScrollArea>`, let content flow in the main scroll container.
- **`src/pages/OwnerFilters.tsx`** — Same fix.
- Adjust `pb-` (bottom padding) on filter content to account for the BottomNavigation height.

#### Phase 3: Recreate a clean "light" theme

**Files to change:**

- **`src/styles/matte-themes.css`** — Add a new `.light` theme class with clean CSS variables:
  - `--background: 0 0% 100%` (pure white)
  - `--foreground: 0 0% 7%` (near-black text)
  - `--card: 0 0% 99%`
  - `--border: 0 0% 90%`
  - Standard shadow values for light mode
  - Same `--primary` accent color as dark theme for brand consistency

- **`src/hooks/useTheme.tsx`** — Add `'light'` to the `Theme` union type. Apply `'light'` class and remove `'dark'` class when light is selected. Keep dark as default.

- **`src/components/ThemeToggle.tsx`** — Update toggle to switch between `'dark'` and `'light'`.

- **Component files** — The ~39 files with `isLight` / `isDark` checks already use semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`). Most will work automatically with the new CSS variables. Only files with inline style overrides (glass effects, shadows) need the `theme === 'light'` check updated.

#### Phase 4: Ensure text colors match backgrounds

- Audit all components that use hardcoded `text-white` or `bg-black` and replace with semantic tokens (`text-foreground`, `bg-background`) where appropriate.
- The new `.light` theme CSS variables will handle contrast automatically for components already using semantic tokens.

---

### Summary of changes

| Area | Files | What |
|------|-------|------|
| Theme system | `useTheme.tsx`, `ThemeToggle.tsx`, `matte-themes.css` | Remove white-matte, add clean light/dark |
| CSS cleanup | `theme-overrides.css` (delete), `index.css` | Remove all `.white-matte` rules |
| Filter scroll | `ClientFilters.tsx`, `OwnerFilters.tsx`, `OwnerFiltersExplore.tsx` | Remove internal ScrollArea so TopBar/BottomNav hide on scroll |
| Component updates | ~39 files | Replace `'white-matte'` string checks with `'light'` |


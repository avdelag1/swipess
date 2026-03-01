

## Plan: White Theme, Google Button Removal, Header Tightening, Logo Size

### 1. Remove Google OAuth button from sign-in/sign-up
**File:** `src/components/LegendaryLandingPage.tsx` (lines 365-389)
- Remove the entire Google OAuth block including the "Continue with Google" button and the "or" divider
- Keep only email/password authentication

### 2. Make header buttons tighter (closer frames to icons/text)
**File:** `src/components/TopBar.tsx`
- Reduce padding on the Tokens button: `px-1.5 sm:px-2` → `px-1 sm:px-1.5`
- Reduce height: `h-8 sm:h-9` → `h-7 sm:h-8`
- Reduce notification button: `h-8 w-8 sm:h-9 sm:w-9` → `h-7 w-7 sm:h-8 sm:w-8`
- Tighten the rounded corners from `rounded-lg` to `rounded-md` for a more compact look

### 3. Make SwipesS logo slightly bigger
**File:** `src/components/SwipessLogo.tsx`
- Change the `sm` size mapping from `h-8` (32px) to `h-9` (36px) so the logo in the TopBar is slightly larger

### 4. Ensure white theme renders across the full app
**File:** `src/components/LegendaryLandingPage.tsx`
- The landing page has hardcoded dark styles (`bg-white/[0.02]`, `text-white`, `border-white/10`). These need theme-aware conditionals so the sign-in card renders properly in white-matte mode with dark text on white background.

**Files to audit for hardcoded dark colors:**
- `src/components/TopBar.tsx` — popover content uses `bg-[#1C1C1E]/95` and `text-white` hardcoded (line 225, 280-285)
- `src/components/BottomNavigation.tsx` — verify it already adapts (it checks `isLight`)

### Technical Details
- The `ThemeToggle` component already toggles between `black-matte` and `white-matte` correctly
- CSS variables in `matte-themes.css` define proper light values for `.white-matte`
- The issue is hardcoded color classes bypassing the CSS variable system
- The landing page form card and popover need semantic tokens (`bg-card`, `text-foreground`, `border-border`) instead of hardcoded rgba values


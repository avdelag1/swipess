

# Fix Unused Imports & Dead Code Cleanup

## Issues Found

After auditing the recently modified files, here are the concrete issues to fix:

### 1. `src/components/BottomNavigation.tsx` — Unused imports
- **`useSpring`, `useMotionValue`** imported from framer-motion but never used (the active pill that used them was removed in the last edit)
- **`PILL_SPRING`** constant defined but never referenced (same reason — pill was removed)
- **`SlidersHorizontal`, `List`, `LayoutGrid`, `Users`, `Briefcase`** imported from lucide-react but never used in any nav item
- **`pillBg`, `pillBorder`, `pillShadow`** variables computed but never used (pill was removed)

### 2. `src/components/BottomNavigation.tsx` — Dead comment block
- Lines 254-258: Old comment about "Active glass pill" references removed code — clean it up

### 3. `src/components/SimpleOwnerSwipeCard.tsx` — Unused imports
- **`DollarSign`** imported from lucide-react — need to verify if used

### 4. No runtime errors detected
- Console logs are clean, no network errors, no build failures
- The app is functioning correctly — these are code hygiene issues that reduce bundle size and prevent lint warnings

## Changes

### File 1: `src/components/BottomNavigation.tsx`
- Remove `useSpring`, `useMotionValue` from framer-motion import
- Remove `SlidersHorizontal`, `List`, `LayoutGrid`, `Users`, `Briefcase` from lucide-react import
- Remove `PILL_SPRING` constant
- Remove `pillBg`, `pillBorder`, `pillShadow` variable declarations
- Remove dead comment about active pill

### File 2: `src/components/SimpleOwnerSwipeCard.tsx`
- Verify and remove `DollarSign` if unused

These are safe, non-breaking cleanup changes that reduce bundle size and eliminate lint warnings.


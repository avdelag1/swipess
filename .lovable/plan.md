

# Slim Down Navigation Bar & Header Buttons

## Problem
1. **Bottom nav**: Each icon has its own glass pill background (the `activeNavPill` with `layoutId`), AND the entire bar has a glass background — two competing glass layers that look heavy/redundant.
2. **Bottom nav bar width**: The outer bar stretches to `max-w-xl` (576px) which is wider than needed.
3. **Header buttons** (Tokens, Notifications): The glass pill frames use `1.5px solid` borders and generous padding, making them appear thick/bulky.

## Changes

### File 1: `src/components/BottomNavigation.tsx`

**Remove individual active pill background**: Delete the entire `AnimatePresence` block containing the `activeNavPill` `motion.div` (lines 258-296). The active state will be communicated purely through the gradient icon color + bold label — no per-icon glass pill needed since the bar itself is already a glass surface.

**Slim the bar**: 
- Change `max-w-xl` to `max-w-md` (448px) on the outer glass container — tighter fit around icons
- Reduce inner padding from `px-2 py-2` to `px-1 py-1.5` — less dead space
- Reduce `borderRadius` from `28px` to `22px` — slimmer profile
- Reduce button padding from `8px 6px` to `6px 4px`

### File 2: `src/components/TopBar.tsx`

**Slim header button frames**:
- Change `glassBorder` from `1.5px solid` to `1px solid` (both themes) — thinner border
- Reduce button heights: `h-7 sm:h-8` → `h-6 sm:h-7` for both Tokens and Notifications buttons
- Reduce padding: `px-1 sm:px-1.5` → `px-1 sm:px-1` on Tokens button
- Reduce back button from `w-10 h-10` to `w-8 h-8` and icon from `w-5 h-5` to `w-4 h-4`
- Avatar border from `border-2` to `border` for a cleaner look

These are purely visual refinements — no logic, routing, or structural changes.


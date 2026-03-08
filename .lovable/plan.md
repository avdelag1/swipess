

# Fix Action Button Positioning and Notification Colors

## Problem
1. **Action buttons too low** — `bottom-20` puts the like/dislike buttons too close to (overlapping with) the nav bar. Previously `bottom-36` was too high. Need a middle ground.
2. **Toast notification colors** — The sonner toasts use a blue-purple-pink gradient that clashes with the app's brand. Need a cohesive color scheme.

## Changes

### 1. Reposition Action Buttons — `bottom-28` (middle ground)

**Files:** `src/components/SwipessSwipeContainer.tsx` (line 1430), `src/components/ClientSwipeContainer.tsx` (line 977)

Change `bottom-20` → `bottom-28` on both. This places buttons comfortably between the card info and the nav bar — not too high, not overlapping.

### 2. Fix Toast/Notification Colors

**File:** `src/components/ui/sonner.tsx`

Replace the default blue-purple-pink gradient with the app's brand palette:
- **Default toast:** Dark glass surface (`bg-[#1a1a1a]`) with white text — clean, neutral
- **Success:** Green-emerald gradient (keep, already good)
- **Error:** Red-rose gradient (keep, already good)  
- **Warning:** Amber-orange gradient (keep, already good)
- **Info:** Brand pink-to-orange gradient (matches SwipesS identity)

### 3. Fix NotificationBar Colors

**File:** `src/components/NotificationBar.tsx`

The notification banner already has good per-type icon colors. The main surface color (`bg-black/85`) is fine for dark mode. No major changes needed here — the sonner toasts are the main issue with clashing colors.


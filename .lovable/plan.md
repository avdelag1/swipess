

## Plan: Fix Flickering, Scroll, Breathing Effect, and Photo Loading

### Root Causes Found

**1. Page Flickering — Double Remount**
Two separate layers both use `key={location.pathname}`, causing every page to be destroyed and recreated twice on navigation:
- `AnimatedOutlet.tsx` line 12: `key={location.pathname}` on the wrapper div
- `AppLayout.tsx` line 134: `key={location.pathname}` on a `motion.div` inside `AnimatePresence`

This double-remount is the source of the flicker. Fix: Remove the `key` from `AnimatedOutlet.tsx` (it's inside the persistent dashboard layout and doesn't need to remount) and simplify the `AppLayout.tsx` animation to opacity-only without `AnimatePresence` mode="wait" which forces sequential unmount→mount.

**2. Liked Pages Still Not Scrollable — AnimatedOutlet blocks it**
`AnimatedOutlet.tsx` line 15 applies `overflow-hidden` to all non-radio routes. This wraps every child page, including Liked pages, and blocks their `overflow-y-auto` from working. Fix: Remove `overflow-hidden` from `AnimatedOutlet` — it's unnecessary since the parent `DashboardLayout` already controls overflow.

**3. Breathing Effect Not Working on Quick Filter Cards**
Two conflicts:
- The parent card has `card-breathe` CSS animation (scale 1→1.015) while framer-motion's `animate` prop continuously sets `scale` on the same element (line 300). Framer-motion inline styles override CSS animations.
- The child image has `photo-swim` (scale 1→1.08) but it's nested inside a parent that's also being scaled by framer-motion, creating conflicts.

Fix: Remove `card-breathe` class from the motion.div (framer-motion overrides it anyway). Keep `photo-swim` only on the `QuickFilterImage` — this is the breathing effect that matters. Ensure the image's `photo-swim` animation isn't blocked by the parent's `overflow-hidden` + transform combination.

**4. Slide-In Photo Loading Transition**
Replace the simple opacity fade in `QuickFilterImage` with a combined slide-in + fade effect, similar to how the nav bar buttons slide. The image will translate from `translateX(20px)` to `translateX(0)` while fading in.

### Changes

**File: `src/components/AnimatedOutlet.tsx`**
- Remove `key={location.pathname}` from the wrapper div (prevents full remount on navigation)
- Remove `overflow-hidden` from the className — this was blocking child scroll containers

**File: `src/components/AppLayout.tsx`**
- Remove the `AnimatePresence` + `motion.div` wrapper with `key={location.pathname}` around `{children}`. Replace with a simple static `div`. The page transitions are already handled by the persistent dashboard layout's `AnimatedOutlet`.

**File: `src/components/CategorySwipeStack.tsx`**
- Remove `card-breathe` class from line 342 (framer-motion overrides CSS animations on the same element, making it pointless)

**File: `src/components/ui/QuickFilterImage.tsx`**
- Replace the opacity-only transition with a combined slide-in + fade: `transform: translateX(20px)` → `translateX(0)` alongside opacity 0→1
- Keep the `photo-swim` breathing animation starting after the slide-in completes

**File: `src/index.css`**
- Add a `@keyframes photo-slide-in` for the combined slide + fade effect used by QuickFilterImage

### Summary
- 4 files modified
- Eliminates double-remount flicker on every page change
- Unblocks scroll on Liked pages by removing the `overflow-hidden` wrapper
- Fixes breathing effect by removing conflicting CSS animation from framer-motion element
- Adds premium slide-in photo loading matching the nav bar's responsive feel


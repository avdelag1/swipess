

# Fix: Missing Bottom Navigation Icons

## What happened
The nav items are all correctly defined in code (8 for client, 9 for owner). The problem is the **edge fade masks** added in the last edit. These masks paint opaque color (`rgba(5,5,5,0.95)`) over a **transparent** navigation bar — so instead of creating a subtle "behind glass" fade, they create solid-colored blocks that visually hide the first and last icons.

## The fix

**File:** `src/components/BottomNavigation.tsx`

1. Change the edge fade masks from opaque solid color to a **true transparency fade** — gradient from `transparent` to `transparent` with just a subtle shadow/blur effect, since the bar background itself is transparent.
2. Alternatively, make the fades use the actual `background` CSS variable so they match whatever is behind the bar, and reduce opacity from 0.95 to ~0.3 so icons remain visible while still getting the soft edge treatment.
3. Reduce fade width from `w-6` (24px) to `w-4` (16px) so they don't cover as much icon area.

**No nav items are added or removed — all buttons stay exactly as they are.** This is purely a CSS visibility fix on the fade overlays.


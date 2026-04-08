

## Plan: Center Dashboard Cards + Align Header + Performance Wins

### Problem 1: Card not centered on screen

The TopBar (60px + safe-area) and BottomNavigation (~68px + safe-area) are both `position: fixed`, but the `<main>` content area has zero padding to compensate. The card stack renders in the full viewport height, so its visual center is offset upward — the card appears too high, as shown in the screenshot.

**Fix**: Add top and bottom padding to the `<main>` element in `AppLayout.tsx` so the content area represents the actual visible space between the fixed header and footer. This will automatically center the card stack in the correct zone.

```
main padding-top: calc(var(--top-bar-height) + var(--safe-top))
main padding-bottom: calc(68px + var(--safe-bottom))
```

### Problem 2: Header buttons misaligned

The TopBar inner flex container (`pl-1.5 pr-2`) has asymmetric padding and the scrollable button row has inconsistent spacing (`gap-1` with `pl-2 pr-1`). The avatar, mode switcher, tokens, radio, theme, and notification buttons are not vertically centered with each other.

**Fix**:
- Normalize padding to symmetric `px-3` on the main container.
- Set `items-center` and consistent `gap-2` on the scrollable row.
- Ensure all icon buttons share identical dimensions (`h-9 w-9`).
- Add `justify-end` to the button row so icons stay right-aligned and balanced.

### Problem 3: Performance — eliminate remaining animation overhead on category cards

The `SwipessSwipeContainer` wraps `CategorySwipeStack` in a `motion.div` with `initial={{ opacity: 0, scale: 0.95 }}` and `AnimatePresence mode="popLayout"` — both cause visible mount lag and layout thrash.

**Fix**:
- Change `AnimatePresence mode="popLayout"` to `mode="sync"` in `SwipessSwipeContainer.tsx` (line 994).
- Set `initial={false}` on the category-stack wrapper `motion.div` to skip mount animation (instant render).
- Remove the redundant `CategorySwipeStack` usage in `MyHubQuickFilters.tsx` — it's not the active code path but adds import weight.

### Problem 4: `useNavigate` runtime error on Index.tsx

This is an HMR edge case where the lazy-loaded `Index` component renders before the Router context is ready. Adding a guard or wrapping with a router check would prevent this.

**Fix**: Wrap the `useNavigate` call in `Index.tsx` inside a try-catch or check that Router context exists before calling it.

### Files to change

| File | Change |
|------|--------|
| `src/components/AppLayout.tsx` | Add padding-top/bottom to `<main>` to account for fixed header/footer |
| `src/components/TopBar.tsx` | Normalize padding, gap, and alignment for header button row |
| `src/components/SwipessSwipeContainer.tsx` | `AnimatePresence mode="sync"`, `initial={false}` on category wrapper |
| `src/pages/Index.tsx` | Guard `useNavigate` against missing Router context |

All changes preserve existing layout architecture and swipe physics — only spacing, alignment, and animation overhead are touched.


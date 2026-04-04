
# Fix Multiple Issues: Radio, Swipe Cards, and Splash Screen

## 1. Remove "APP INITIALIZATION DELAYED" button and "Reload App" from splash
**File: `index.html` (lines 132-135)**
Remove the entire `#mount-recovery` div containing the "APP INITIALIZATION DELAYED" text and "Reload App" button. Also remove any JS that shows this element (the timeout in the script block below).

## 2. Make swipe cards larger (fill space between header and nav bar)
**File: `src/components/swipe/SwipeConstants.ts`**
- Increase `PK_H` from `420` to `520` and `OWNER_PK_H` from `420` to `520`

**File: `src/components/swipe/SwipeAllDashboard.tsx`**
- Use `calc(100dvh - header - nav)` approach: pass available height or use CSS to ensure the card container fills exactly the space between header (52px + safe-top) and bottom nav (68px + safe-bottom) without overlapping either

**File: `src/components/swipe/OwnerAllDashboard.tsx`**
- Same sizing adjustments

## 3. Fix swipe exit animation — card must go behind (shrink + recede), not just sideways
**File: `src/components/swipe/PokerCategoryCard.tsx`**
The current implementation uses `useTransform` to derive scale/opacity from x position, but there's a conflict: `animate` block sets `scale` for non-top cards, and `style` sets `scale` for top cards via `exitScale`. The problem is both `animate.scale` and `style.scale` are fighting. Fix:
- For the exit animation, animate x to a smaller value (±200) while using `useTransform` to map x to scale (1→0.6) and opacity (1→0). This creates the "receding behind" effect
- Remove the conflicting `scale` in the `animate` block for non-top cards — use only `style` for scale
- Fix the `exitOpacity` transform range — currently maps to 0 at edges which causes cards to vanish too early during drag. Adjust to only fade significantly past the commit threshold

## 4. Fix stacked cards getting smaller and blurred
**File: `src/components/swipe/PokerCategoryCard.tsx`**
- Reduce `stackBlur` from `index * 0.8` to `0` — remove blur entirely from stacked cards so they remain visible
- Reduce scale degradation: change `stackScale` from `1 - (index * 0.08)` to `1 - (index * 0.04)` so back cards don't shrink as aggressively
- Increase `stackBrightness` floor so back cards aren't too dark

## 5. Move swipe hint arrows OUTSIDE the card
**File: `src/components/swipe/PokerCategoryCard.tsx`**
- Remove the chevron arrows from inside the card's inner div

**File: `src/components/swipe/SwipeAllDashboard.tsx` and `OwnerAllDashboard.tsx`**
- Add the pulsing chevron arrows as siblings of the card stack container, positioned outside the cards (e.g., `left: -30px` and `right: -30px` from the card stack). These are clickable — tapping left arrow cycles left, tapping right cycles right
- Keep the `swipe-hint-left` / `swipe-hint-right` pulsing animation classes

## 6. Fix Radio page not opening
**File: `src/components/DashboardLayout.tsx`**
The radio page renders inside `<main>` which has `absolute inset-0` and `z-0`. The radio uses `fixed inset-0 z-50` but since it's inside the `<main>` with `overflow-y-hidden` (for fullscreen routes), the fixed positioning should work. However, the parent `.app-root` has `overflow-hidden` which clips fixed-position children.

Fix: When `isFullScreenRoute` is true, render the radio content outside/above the main container, OR change the `<main>` element to not clip fixed children by removing `overflow-hidden` constraints for fullscreen routes. Specifically:
- For fullscreen routes, set `<main>` to `position: static` (not absolute) so the radio's `fixed inset-0` positions relative to the viewport
- Or: render a portal for the radio page that sits outside the `<main>` scroll container entirely

## 7. Fix runtime error (bonus)
**File: `src/pages/RoommateMatching.tsx` line 113**
`supabase.select is not a function` — should be `supabase.from('table').select(...)`. Fix the query syntax.

---

## Files to modify
| File | Changes |
|------|---------|
| `index.html` | Remove mount-recovery div and its timeout JS |
| `src/components/swipe/SwipeConstants.ts` | Increase PK_H/OWNER_PK_H to 520 |
| `src/components/swipe/PokerCategoryCard.tsx` | Fix exit animation (recede behind), remove blur from stacked cards, remove arrows from inside card |
| `src/components/swipe/SwipeAllDashboard.tsx` | Add external clickable arrows, size container to viewport |
| `src/components/swipe/OwnerAllDashboard.tsx` | Same arrow + sizing changes |
| `src/components/DashboardLayout.tsx` | Fix radio rendering — ensure fixed positioning works for fullscreen routes |
| `src/pages/RoommateMatching.tsx` | Fix supabase query syntax |

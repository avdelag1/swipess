

# Implement Performance + UI Plan (7 Items)

Items 1, 4, 5, and 7 are already completed from previous work. Three items remain:

## Remaining Changes

### 1. Increase Card Height (PK_H: 480 → 520)
**File: `src/components/swipe/SwipeConstants.ts`**
- Change `PK_H` from `480` to `520`
- Change `OWNER_PK_H` from `480` to `520`

### 2. Fix Swipe Exit Animation (recede behind, not fly sideways)
**File: `src/components/swipe/PokerCategoryCard.tsx`**
The current `useTransform` ranges map scale and opacity based on x position, but the exit animation only pushes x to ±200, and the opacity fades too aggressively during drag. Fix:
- Change `exitScale` range: `[-250, -100, 0, 100, 250]` → `[0.5, 0.85, 1, 0.85, 0.5]` — deeper shrink effect
- Change `exitOpacity` range: `[-250, -180, 0, 180, 250]` → `[0, 0.5, 1, 0.5, 0]` — fade only past threshold
- Reduce exit `animate(x)` target from ±200 to ±250 for more travel distance with the recede
- Add `rotate` transform via `useTransform` mapping x to slight Z rotation (e.g. ±8deg) for a card-toss feel
- Set `dragConstraints` to `{ left: -150, right: 150 }` for more drag range before snap-back

### 3. Fix Radio Page Not Opening
**File: `src/components/DashboardLayout.tsx`**
The radio page uses `fixed inset-0 z-50` but renders inside `<main>` which has `overflow-hidden` when `isFullScreenRoute` is true. On some browsers/devices, `overflow-hidden` on a positioned parent clips fixed children (especially when `will-change`, transforms, or filters exist on ancestors).

Fix: When `isFullScreenRoute` is true, remove `overflow-hidden` from the `<main>` element. Change:
```
isFullScreenRoute ? "fixed inset-0 overflow-hidden" 
```
to:
```
isFullScreenRoute ? "fixed inset-0 overflow-visible"
```

This allows the radio's `fixed inset-0 z-50` to render properly above everything.

---

## Already Completed (no changes needed)
- Splash "APP INITIALIZATION DELAYED" button — already removed
- Stack blur/scale — already fixed (blur=0, scale=0.04 per card)  
- External arrows — already outside cards
- RoommateMatching supabase query — already correct

## Files to Modify
| File | Change |
|------|--------|
| `src/components/swipe/SwipeConstants.ts` | PK_H/OWNER_PK_H → 520 |
| `src/components/swipe/PokerCategoryCard.tsx` | Deeper recede animation + rotation |
| `src/components/DashboardLayout.tsx` | Remove overflow-hidden on fullscreen routes |




# Full Audit: Frontend and Backend Fixes

## Critical Backend Issue

The `vite.config.ts` file hardcodes credentials for the **wrong** backend project (`vplgtcguxujxwrgguxqq`). The correct project is `qegyisokrxdsszzswsqk`. This means authentication, data loading, photo uploads -- everything backend-related -- is broken or pointing to a stale/empty project.

### Fix 1: Correct backend credentials in `vite.config.ts`

**Lines 13-16**: Update preconnect hints from `vplgtcguxujxwrgguxqq` to `qegyisokrxdsszzswsqk`.

**Lines 129-131**: Update the `define` block:
- `VITE_SUPABASE_URL` → `https://qegyisokrxdsszzswsqk.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` → the correct anon key for `qegyisokrxdsszzswsqk`
- `VITE_SUPABASE_PROJECT_ID` → `qegyisokrxdsszzswsqk`

This single fix restores all backend connectivity: auth, photo uploads, profile creation, listing CRUD.

---

## Frontend Issue: Card info overlapping action buttons

The listing info overlay (rating, price, property details) sits at `bottom-32` inside `SimpleSwipeCard.tsx` (line 535). The action button bar sits at `bottom-24` in `SwipessSwipeContainer.tsx` (line 1437). Since buttons are ~80px tall with padding, the info text overlaps with them.

### Fix 2: Move card info higher to avoid button overlap

In `SimpleSwipeCard.tsx` line 535, change `bottom-32` to `bottom-44` (or approximately 176px). This pushes the rating badge, price, and property details up above the floating button bar, eliminating the overlap.

### Confirm: Buttons are NOT part of the swipe card

The action buttons are already rendered **outside** the draggable `motion.div` in `SwipessSwipeContainer.tsx` at z-index 30. They are absolutely positioned within the container, not inside the card. They correctly stay fixed while the card moves. No change needed here.

---

## Summary

| Issue | File | Fix |
|-------|------|-----|
| Wrong backend credentials | `vite.config.ts` | Update all 3 Supabase env vars + preconnect to correct project ID |
| Card info overlaps buttons | `SimpleSwipeCard.tsx` | Change `bottom-32` to `bottom-44` on the content overlay div |


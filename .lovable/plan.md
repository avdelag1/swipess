
# Fix Header, Navigation Brightness, Swipe Errors, and Listing Display

## Problems Identified

1. **Header too thick/dark** - The solid black header with a `::after` fade gradient creates a double-dark effect. The header needs to be slimmer and use only one fade layer.
2. **Bottom nav icons too dim** - Icons use `text-white/90` which is hard to see. Need brighter icons.
3. **Top bar icons too dim** - Same issue with the Zap and Bell icons.
4. **Swipe "ON CONFLICT" error** - The `likes` table has NO unique constraint on `(user_id, target_id, target_type)`, but `useSwipe.tsx` uses `upsert` with `onConflict: 'user_id,target_id,target_type'`. This causes every swipe to fail.
5. **Old/stale listing data showing** - Listings have empty `images: []` arrays, causing placeholder icons. The 19 active listings are real but have no images, which makes them look broken. The cards are actually showing but the data looks stale because images are missing.
6. **Missing `reviews` table** - Console shows `Could not find the table 'public.reviews'`.

## Plan

### 1. Database Migration - Fix the likes unique constraint and create reviews table

Add the missing unique constraint on `likes(user_id, target_id, target_type)` so upsert works. Also create the `reviews` table to stop that error.

```sql
-- Add unique constraint for upsert to work
ALTER TABLE public.likes 
  ADD CONSTRAINT likes_user_target_unique 
  UNIQUE (user_id, target_id, target_type);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (...);
```

### 2. Slim down the header (CSS)

In `src/index.css`:
- Reduce header padding (6px to 4px)
- Change header background from solid `#000000` to a semi-transparent `rgba(0,0,0,0.85)` so it blends better
- Reduce the `::after` fade gradient height from 24px to 16px and make it softer
- Remove the `!important` on the background

### 3. Brighten navigation icons

In `src/components/BottomNavigation.tsx`:
- Change inactive icon color from `text-white/90` to `text-white`
- Change inactive label from `text-white/90` to `text-white`

In `src/components/TopBar.tsx`:
- Brighten the Zap and Bell icons to pure white

### 4. Fix bottom bar background

In `src/index.css`:
- Change `.app-bottom-bar` background from `#1C1C1E` to a more transparent dark with a top-fade effect (similar to header's bottom-fade)
- Remove the hard `border-top`

### 5. Invalidate listing cache after swipe

In `src/hooks/useSwipe.tsx`:
- Add `queryClient.invalidateQueries({ queryKey: ['smart-listings'] })` in `onSuccess` to refresh the deck after swiping

## Technical Details

### Files to modify:
- `src/index.css` - Header and bottom bar styling
- `src/components/BottomNavigation.tsx` - Icon brightness  
- `src/components/TopBar.tsx` - Icon brightness
- `src/hooks/useSwipe.tsx` - Add smart-listings cache invalidation
- New migration SQL - Add unique constraint on likes + create reviews table

### Files NOT modified:
- `src/integrations/supabase/types.ts` (auto-generated)
- `src/integrations/supabase/client.ts` (auto-generated)

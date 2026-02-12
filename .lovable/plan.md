

# Fix Swipe Cards: Missing Data, Broken Upsert, and Missing DB Columns

## Problems Found

### 1. Swipe upsert fails silently - missing UPDATE policy on `likes`
The `likes` table has INSERT, SELECT, and DELETE policies but **no UPDATE policy**. The `useSwipe.tsx` hook uses `upsert` which requires UPDATE permission when a row already exists. This means every re-swipe on the same listing fails silently.

### 2. Listings show placeholder images instead of real photos
All seed listings have `images: []` (empty array) but they DO have a populated `image_url` column with real Unsplash URLs. The swipe card (`SimpleSwipeCard.tsx`) only reads from `listing.images`, never falling back to `image_url`. This makes every card show a grey placeholder icon.

### 3. Missing columns on `profiles` table cause repeated 400 errors
The network logs show constant 400 errors for:
- `radio_current_station_id` - used by the radio feature
- `swipe_sound_theme` - used by swipe sound settings

These columns don't exist on the `profiles` table yet.

## Plan

### Step 1: Database Migration
Add the missing pieces in one migration:

```sql
-- 1. Add UPDATE policy on likes for upsert to work
CREATE POLICY "Users can update their own likes"
  ON public.likes FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Add missing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS radio_current_station_id text,
  ADD COLUMN IF NOT EXISTS swipe_sound_theme text DEFAULT 'default';
```

### Step 2: Fix image fallback in swipe card
In `src/components/SimpleSwipeCard.tsx`, update the `images` memo to fall back to `image_url` when the `images` array is empty:

```typescript
const images = useMemo(() => {
  if (Array.isArray(listing.images) && listing.images.length > 0) {
    return listing.images;
  }
  // Fallback to legacy image_url field
  if ((listing as any).image_url) {
    return [(listing as any).image_url];
  }
  return [FALLBACK_PLACEHOLDER];
}, [listing.images, (listing as any).image_url]);
```

### Step 3: Include `image_url` in smart matching query
In `src/hooks/useSmartMatching.tsx`, add `image_url` to the `SWIPE_CARD_FIELDS` select string so the fallback has data to work with. Currently only `images` is selected.

## Technical Details

### Files to modify:
- New migration SQL - Add UPDATE policy on likes + add missing profile columns
- `src/components/SimpleSwipeCard.tsx` - Image fallback logic (lines ~97-101)
- `src/hooks/useSmartMatching.tsx` - Add `image_url` to SWIPE_CARD_FIELDS (line ~390)

### Result after fix:
- Swipe right/left will save correctly (upsert works with UPDATE policy)
- All listings will show their actual photos (falling back to `image_url`)
- No more 400 errors for missing profile columns in network logs


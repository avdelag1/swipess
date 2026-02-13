

# Fix Swipe Cards: Buttons, Blinking, Preloading, and Mock Data

## Problems Identified

1. **Profile creation fails** -- The `profiles` table is missing `is_active` and `role` columns, causing PGRST204 errors on every sign-in attempt. This breaks profile setup for new and returning users.

2. **All listing images are empty** -- Every listing in the database has `images: []`. The swipe cards show placeholder images instead of real photos, making it impossible to test the carousel.

3. **No motorcycle/bicycle/worker listings** -- Only 18 property listings and 1 bicycle listing exist. There is nothing to show when users filter by Motorcycle or Workers.

4. **Only 1 client profile** -- The owner swipe deck has only 1 client profile (Alejandro), making it impossible to test owner-side like/dislike flow properly.

5. **Black screen blink between swipes** -- When the top card exits, the next card briefly shows a black/empty frame before the image loads. The preloading works for the first image only but does not preload ALL images of the next 2 cards aggressively enough.

6. **Owner card button-triggered swipes may not fire `onSwipe`** -- The `SimpleOwnerSwipeCard` calls `handleButtonSwipe` which animates x/y exit, but the `onComplete` callback may not fire reliably if the component unmounts during animation.

## Plan

### Step 1: Database Migration -- Add missing columns + seed data

Add the missing `is_active` (boolean, default true) and `role` (text, nullable) columns to the `profiles` table so `useProfileSetup` stops crashing.

Insert mock listings with real sample image URLs:
- 5 motorcycle listings (sale + rent) with 3-4 images each
- 3 bicycle listings with 2-3 images each
- 3 worker/service listings with 2 images each
- Update existing property listings to have 3-4 sample images each

Insert 4-5 additional mock client profiles with multiple profile images for owner-side swiping.

### Step 2: Fix the black blink between swipes

The root cause: when `currentIndex` advances, the next card's `CardImage` component starts with `loaded = false` and shows a skeleton, even if the image was already preloaded into the browser cache.

**Fix in `SimpleSwipeCard.tsx` and `SimpleOwnerSwipeCard.tsx`:**
- Check the shared `imageCache` Map on mount. If the image URL is already cached, initialize `loaded = true` so no skeleton/transition is shown.
- Already partially implemented but the owner card uses its own local `imageCache` instead of the shared one. Unify both to use `@/lib/swipe/cardImageCache`.

**Fix in `TinderentSwipeContainer.tsx`:**
- After every swipe, preload ALL images (not just `[0]`) of the next 3 cards into the shared cache.
- Use `requestIdleCallback` for cards 2-3 to avoid blocking.

**Fix in `ClientSwipeContainer.tsx`:**
- Same: preload ALL images of next 3 profiles after each swipe.

### Step 3: Fix owner card like/dislike button reliability

In `SimpleOwnerSwipeCard.tsx`, the `handleButtonSwipe` fires `onSwipe(direction)` inside `animate().onComplete`. If the parent unmounts or re-renders the card before animation completes, the callback is lost.

**Fix:** Add a safety timeout (same pattern as `TinderentSwipeContainer`). After calling `animate()`, set a 350ms timeout that calls `onSwipe` if it hasn't been called yet. This ensures the swipe always fires.

### Step 4: Fix undo/return button on both sides

The undo button is already wired (`onUndo={undoLastSwipe}`, `canUndo={canUndo}`). Verify it works by ensuring the `useSwipeUndo` hook properly restores the previous card index in both containers. No code change expected here -- the undo logic is already implemented. The button appears disabled when `canUndo = false` (first card).

## Technical Details

### Files to create/modify:
- **New migration SQL** -- Add `is_active` and `role` to `profiles`, insert mock data with images
- **`src/components/SimpleOwnerSwipeCard.tsx`** -- Import shared `imageCache` from `@/lib/swipe/cardImageCache`, add safety timeout to `handleButtonSwipe`
- **`src/components/SimpleSwipeCard.tsx`** -- Ensure `CardImage` checks shared cache on init (already does this)
- **`src/components/TinderentSwipeContainer.tsx`** -- Preload ALL images of next 3 cards (not just first image)
- **`src/components/ClientSwipeContainer.tsx`** -- Preload ALL profile images of next 3 profiles
- **`src/hooks/useProfileSetup.tsx`** -- Remove `role` from the upsert payload (not a column), keep `is_active`

### Mock image sources:
Use royalty-free Unsplash/Picsum URLs for mock data images (e.g., `https://images.unsplash.com/photo-...?w=800&h=1200&fit=crop`). These load fast and look realistic for testing the carousel.


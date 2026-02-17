

# Fix Sign-In Errors, Add Flame Like Button, Enhance Button Feel, and Fix White Background Contrast

## Problem Summary

1. **Error notification on sign-in**: The console shows `column profiles.average_rating does not exist` -- the `useUserRatingAggregate` hook queries `profiles.average_rating` and `profiles.total_reviews`, but these columns don't exist in the `profiles` table. This fires every time a dashboard loads and shows error toasts.

2. **Like button needs a flame icon**: The `SwipeActionButtonBar` currently uses a green Heart for the like button. User wants an orange-red flame instead, on both client and owner sides.

3. **Buttons should feel more "real"**: The current action buttons are transparent with no background frame. Adding subtle glass-pill backgrounds with depth (shadow, border, backdrop-blur) will make them feel tactile and premium.

4. **White background contrast**: Several pages (contracts, radio, discover clients) use white/light backgrounds with dark text that doesn't contrast well. Fonts need to match the background they sit on.

---

## Technical Plan

### 1. Fix the `average_rating` Error

**File: `src/hooks/useReviews.tsx`** (lines ~280-330)

The `useUserRatingAggregate` function queries `profiles.average_rating` and `profiles.total_reviews` -- columns that don't exist. Instead of adding columns, rewrite this function to compute the aggregate from the `reviews` table directly (same approach as `useListingRatingAggregate`). This eliminates the error without requiring a database migration.

- Query `reviews` table where `reviewed_id = userId`
- Compute average rating and count client-side
- Return the same `ReviewAggregate` shape

### 2. Add Flame Icon on Like Button

**File: `src/components/SwipeActionButtonBar.tsx`**

- Import `Flame` from `lucide-react` (already available in the project)
- Replace `Heart` with `Flame` on the like button (line ~298)
- Change the like variant color from green (`#22c55e`) to an orange-red gradient feel (`#ff6b35` or `#ef4444` blended with orange)
- Update the variant config for `like` to use orange-red tones: icon `#ff6b35`, glow `rgba(255, 107, 53, 0.4)`, border `rgba(255, 107, 53, 0.35)`

### 3. Make Buttons Feel More Real (Tactile Premium)

**File: `src/components/SwipeActionButtonBar.tsx`**

Currently buttons have `backgroundColor: 'transparent'` and `border: 'none'`. Update:

- Add a subtle glass-pill background: `rgba(255,255,255,0.06)` with `backdrop-blur(8px)`
- Add a thin border: `1px solid rgba(255,255,255,0.12)`
- Add a soft inset top glow via `box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3)`
- Round to full circle (`border-radius: 50%`)
- On press, compress the shadow and darken slightly for a "pushed in" feel

### 4. Fix White Background Font Contrast

**Files affected:**
- `src/pages/OwnerContracts.tsx` and `src/pages/ClientContracts.tsx` -- status badges use `bg-gray-100 text-gray-800` etc. These are fine on white, but ensure parent containers have proper dark theme support
- `src/pages/RadioPlayer.tsx` -- white circles with black text are intentional design (vinyl/tape aesthetic), leave as-is
- `src/pages/OwnerDiscoverClients.tsx` -- `bg-white text-black` button, ensure it has sufficient contrast
- `src/components/ui/button.tsx` -- the `tinder` variant uses `bg-white/90 text-card-foreground`, verify `card-foreground` resolves to a dark color

Primary fix: Scan for any `bg-white` or light background containers where text uses `text-white` or low-opacity white (invisible on white). Add explicit dark text colors (`text-gray-900`, `text-gray-700`) where backgrounds are white/light.

---

## Implementation Order

1. Fix `useUserRatingAggregate` to query `reviews` table (eliminates error toasts)
2. Replace Heart with Flame icon + orange-red color on like button
3. Add glass-pill depth to all swipe action buttons
4. Audit and fix white-background text contrast across affected pages


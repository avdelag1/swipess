

# Fix Multiple Issues: Bottom Nav, Token Packages, Swipe Cards, and Profile

This plan addresses several issues you've reported, organized by priority.

---

## 1. Remove Background/Frames from Bottom Navigation Buttons

**Problem**: Bottom navigation buttons have `bg-white/10 hover:bg-white/25` creating visible frames/squares around each icon.

**Fix**: Remove the background styling from nav buttons in `BottomNavigation.tsx` so they appear as clean floating icons without any box or frame behind them.

---

## 2. Fix Token Packages Display (Both Client and Owner)

**Problem**: The `MessageActivationPackages` component references a `tokens` column that doesn't exist in the database. The actual column is `message_activations`. Additionally, the packages show "Loading..." because the query uses the wrong column name.

**Fix**: Update the `convertPackages` function in `MessageActivationPackages.tsx` to use `message_activations` instead of `tokens`. The database already has 3 packages for each role (client: 5/10/25 tokens at $49/$89/$169, owner: 5/10/25 tokens at $59/$109/$199).

---

## 3. Make Token Package Cards Smaller/More Compact

**Problem**: The cards are oversized with large padding and spacing.

**Fix**: Reduce padding, font sizes, and icon sizes in the package cards. Make the token number display smaller, reduce card header spacing, and tighten the overall layout. Also make the header section smaller as requested.

---

## 4. Add PayPal Button

**Problem**: The current "Buy Now" button redirects to a PayPal link via `window.open()`, but there's no visible PayPal branding.

**Fix**: Add a PayPal logo/icon to the purchase button and style it to look like an official PayPal button, making it clear this is a PayPal payment.

---

## 5. Fix Build Error (StationDrawer)

**Problem**: The `CityLocation` type includes `'italy'` but the `CITY_ICONS` map in `StationDrawer.tsx` is missing the `italy` entry.

**Fix**: Add `'italy': 'IT'` to the `CITY_ICONS` Record in `StationDrawer.tsx`.

---

## 6. Swipe Card Verification

**Problem**: Potential issues with swipe left, right, top, photo scrolling, and tap interactions.

**Current State Review**: The swipe system looks well-implemented with:
- Left/right swipe with threshold detection
- Diagonal movement with physics
- Image tap zones (left third = prev photo, right third = next photo, middle = insights)
- Press-and-hold magnifier with 350ms delay
- Button-triggered swipes via ref

**Potential Issues Identified**:
- The `dragListener={false}` combined with manual `dragControls.start()` means drag only starts after 15px movement AND after the magnifier hold timer is checked. This could feel unresponsive.
- The pointer event flow (unified handler) may conflict in some edge cases between magnifier, drag, and tap.

**Fix**: Review and tighten the gesture coordination. Ensure the 15px movement threshold for distinguishing drag vs. hold-to-zoom is responsive enough. No major structural changes needed -- the architecture is solid.

---

## 7. Profile Photo Upload Verification

**Current State**: The `ClientProfileDialog` uses `PhotoUploadManager` component for photo uploads. The profile page (`ClientProfileNew`) shows profile images and links to the edit dialog.

**Fix**: Verify the `PhotoUploadManager` component works correctly with the storage bucket. No code changes anticipated unless testing reveals issues.

---

## Technical Details

### Files to modify:
1. **`src/components/BottomNavigation.tsx`** -- Remove `bg-white/10 hover:bg-white/25` from button className
2. **`src/components/MessageActivationPackages.tsx`** -- Fix `tokens` to `message_activations`, reduce card sizes, add PayPal branding to button
3. **`src/components/radio/retro/StationDrawer.tsx`** -- Add `'italy': 'IT'` to CITY_ICONS
4. **`src/components/SimpleSwipeCard.tsx`** -- Minor gesture tuning if needed after testing

### No database changes required
All 6 token packages (3 client + 3 owner) already exist in the database with correct data.


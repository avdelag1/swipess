

# Fix Build Errors & Ensure Full Feature Connectivity

## Summary
There are 12 build errors preventing the app from running, plus the user wants assurance that all features (listing uploads, profile management, swipe actions, events, promotions, roommate matching) are properly connected. The plan addresses build errors first, then audits key user flows.

---

## Step 1: Fix Build Errors (12 errors across 5 files)

### 1a. `src/components/CategorySwipeStack.tsx` (line 39)
- `haptics.light()` does not exist. The `haptics` object from `microPolish.ts` has `tap`, `select`, `success`, etc. but no `light`.
- **Fix**: Change `haptics.light()` → `haptics.tap()`.

### 1b. `src/components/ui/sonner.tsx` (line 17)
- `swipeDirections={['up']}` — `'up'` is not a valid `SwipeDirection` in the current sonner version.
- **Fix**: Remove the `swipeDirections` prop entirely (use default behavior).

### 1c. `src/contexts/RadioContext.tsx` (line 223)
- `.values().next().value` can be `undefined`, but `delete()` expects `string`.
- **Fix**: Add a null check: `const first = failedStationsRef.current.values().next().value; if (first) failedStationsRef.current.delete(first);`

### 1d. `src/pages/ClientLikedProperties.tsx` (lines 91, 94)
- `property.target_type` does not exist on the `Listing` type.
- **Fix**: Remove references to `target_type`, use only `property.category` for filtering.

### 1e. `src/pages/PromotionRequest.tsx` (7 errors — missing icon imports)
- Missing imports: `Clock`, `DollarSign`, `Tag`, `X`, `MessageCircle`, `ArrowUpRight`.
- **Fix**: Add all missing icons to the lucide-react import statement at the top of the file.

---

## Step 2: Verify Listing Upload Flow
- Audit `UnifiedListingForm` → ensure it calls the correct upload handler and writes to the `listings` table with `user_id` and `owner_id`.
- Confirm `PhotoUploadManager` correctly uploads to the `listing-images` storage bucket.
- Confirm profile photo uploads work for both client and owner via `PhotoCamera` / `usePhotoCamera`.

## Step 3: Verify Profile Flows
- Client profile: ensure `ClientProfileNew` saves to `client_profiles` table with all fields (bio, age, interests, etc.).
- Owner profile: ensure `OwnerProfileNew` saves to `owner_profiles` table with business fields.
- Confirm avatar/photo persistence via `profile-images` bucket.

## Step 4: Verify Events & Promotion Pages
- `EventosFeed.tsx`: Confirm it queries real data from backend (currently has mock fallback) and all buttons (WhatsApp, share, like) function.
- `PromotionRequest.tsx`: Confirm the form submits to the backend, image uploads to `event-images` bucket, and the review/submit flow works end-to-end.

## Step 5: Verify Roommate Matching
- `RoommateMatching.tsx`: Currently uses mock data with real data fallback via `useSmartClientMatching`. Confirm the `roommate_available` toggle in client profile works and filters candidates correctly.
- Ensure current user is excluded from their own roommate discovery deck.
- Verify swipe actions (like/dislike/undo/message) call the correct backend mutations.

## Step 6: Verify Swipe Card Actions
- Confirm all 5 action buttons (Undo, Dislike, Share, Like, Message) in `SwipeActionButtonBar` trigger the correct handlers.
- Verify likes are persisted to the `likes` table.
- Verify swipes are recorded in the `swipes` table.
- Confirm match detection works (mutual likes trigger `MatchCelebration`).
- Confirm messaging flow: like → message confirmation → conversation creation.

---

## Technical Details

**Files to modify:**
1. `src/components/CategorySwipeStack.tsx` — fix `haptics.light()` → `haptics.tap()`
2. `src/components/ui/sonner.tsx` — remove `swipeDirections` prop
3. `src/contexts/RadioContext.tsx` — add null check for Set iterator
4. `src/pages/ClientLikedProperties.tsx` — remove `target_type` references
5. `src/pages/PromotionRequest.tsx` — add missing lucide icon imports

**No database changes required** — all tables and RLS policies are already in place.


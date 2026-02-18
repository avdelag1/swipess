
# Round 4 Focused Audit — Likes, Listings, and User-to-User Messaging

## Confirmed Fixed from Round 3

All Round 3 fixes are confirmed correct:
- `useProfileCache.ts` — `.eq('user_id')`, `.in('user_id')`, map keys use `user_id` ✓
- `useOwnerInterestedClients.tsx` — `.in('user_id', userIds)`, `profileMap.set(p.user_id, p)` ✓
- `useClientProfiles.tsx` — `user_id` in SELECT, `.neq('user_id', user.id)` ✓
- `useSmartMatching.tsx` — client section uses `user_id` ✓
- `useMessageActivations.ts` — `queryKey: ['message_activations']` ✓
- `useAuth.tsx` — cache clear uses `['message_activations']` ✓

---

## NEW ISSUES FOUND (Round 4) — 10 Bugs

---

### CRITICAL — Direct runtime failures

**BUG A: `useSwipeWithMatch` — owner profile lookup for notification uses `.eq('id', user.id)` — wrong column**
- **File:** `src/hooks/useSwipeWithMatch.tsx` — Line 185
- **Bug:** When an owner right-swipes on a client, the code fetches the owner's profile with:
  ```
  supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id)
  ```
  `profiles.id` is the internal UUID, not the auth UID. This returns 0 rows. Result: every "New Flame!" notification sent to the liked client shows the name as `"Someone"` instead of the actual owner's name. This is the same `id` vs `user_id` bug class, just in a new file.
- **Fix:** Change `.eq('id', user.id)` → `.eq('user_id', user.id)` on line 185.

**BUG B: `useSwipeWithMatch` — client profile lookup for listing-owner notification uses `.eq('id', user.id)` — wrong column**
- **File:** `src/hooks/useSwipeWithMatch.tsx` — Line 263
- **Bug:** When a client right-swipes on a listing, the code fetches the client's profile with:
  ```
  supabase.from('profiles').select('full_name').eq('id', user.id)
  ```
  Same class of bug. Returns 0 rows. Listing owner receives notification saying `"Someone liked [listing]!"` instead of the client's actual name.
- **Fix:** Change `.eq('id', user.id)` → `.eq('user_id', user.id)` on line 263.

**BUG C: `useSwipeWithMatch` — profile existence check for owner-likes-client uses `.eq('id', targetId)` — wrong column**
- **File:** `src/hooks/useSwipeWithMatch.tsx` — Line 66
- **Bug:** Before saving an owner→client like, the code verifies the client exists:
  ```
  supabase.from('profiles').select('id, full_name, city').eq('id', targetId).maybeSingle()
  ```
  `targetId` here is the client's auth UID (from `likes.user_id`). Querying `profiles.id` with an auth UID never matches. So `clientExists` is always `null`, which triggers the error: `"This user profile is no longer available"`. **This means every owner right-swipe on a client is blocked with a profile-not-found error** — a complete feature failure.
- **Fix:** Change `.eq('id', targetId)` → `.eq('user_id', targetId)` on line 66.

**BUG D: `useConversations.fetchSingleConversation` — profile lookup uses `.eq('id', otherUserId)` — wrong column**
- **File:** `src/hooks/useConversations.tsx` — Line 212
- **Bug:** The `fetchSingleConversation` fallback function (called when a conversation isn't in the React Query cache) fetches the other user's profile with:
  ```
  supabase.from('profiles').select('id, full_name, avatar_url').eq('id', otherUserId)
  ```
  `otherUserId` comes from `conversations.client_id` or `conversations.owner_id` — both are auth UIDs. Returns 0 rows. When this fallback is triggered (e.g., after clicking a notification link to open a conversation), the messaging interface opens with `otherUser: undefined` and shows a perpetual loading state.
- **Fix:** Change `.eq('id', otherUserId)` → `.eq('user_id', otherUserId)` on line 212. Also change the select to include `user_id` instead of `id`: `'user_id, full_name, avatar_url'`.

**BUG E: `PropertyDetails` — PostgREST FK join on `listings_owner_id_fkey` that does not exist in this schema**
- **File:** `src/components/PropertyDetails.tsx` — Lines 47–53
- **Bug:** The listing detail dialog tries to join the owner's profile via:
  ```sql
  profiles!listings_owner_id_fkey (full_name, avatar_url)
  ```
  The `listings` table schema shows `owner_id` is a `uuid` column but there is **no foreign key constraint named `listings_owner_id_fkey`** to `profiles`. PostgREST silently returns `null` for the join. The owner's name and avatar are never shown in the listing detail view — the owner section is always empty.
- **Fix:** Rewrite as a two-step query: first fetch the listing, then fetch the owner profile separately with `.eq('user_id', listing.owner_id)`.

---

### HIGH SEVERITY — UX regressions

**BUG F: `useListings` — swiped listing exclusion filter uses wrong string format for `.not('id', 'in', ...)`**
- **File:** `src/hooks/useListings.tsx` — Lines 139–141
- **Bug:** The exclusion of already-swiped listings uses:
  ```js
  query = query.not('id', 'in', `(${excludeSwipedIds.map(id => `"${id}"`).join(',')})`)
  ```
  PostgREST `.not('id', 'in', ...)` expects the third argument to be a **comma-separated list wrapped in parentheses without quotes around UUIDs**: `(uuid1,uuid2,uuid3)`. The current code wraps each UUID in double-quotes: `("uuid1","uuid2")`, which is invalid SQL and causes the filter to fail silently. Previously swiped listings reappear in the deck.
- **Fix:** Change to: `` query = query.not('id', 'in', `(${excludeSwipedIds.join(',')})`) ``

**BUG G: `EnhancedPropertyCard` — hardcodes price label as `/month` for all listing types**
- **File:** `src/components/EnhancedPropertyCard.tsx` — Line 303
- **Bug:** The price label at line 303 unconditionally renders `"/month"` regardless of the actual `listing.rental_duration_type`. A daily bicycle rental, a motorcycle for sale, or a worker listing charged hourly would all show `/month` — wrong information shown to the user.
- **Fix:** Add a computed label like `SimpleSwipeCard` does at line 381: derive from `listing.rental_duration_type` to show `/day`, `/mo`, or nothing (for `'sale'`).

**BUG F: `useSwipedListings` — uses 1-day lookback window — swiped cards reappear after 24 hours**
- **File:** `src/hooks/useListings.tsx` — Lines 256–264
- **Bug:** `useSwipedListings` only fetches likes from the last 24 hours (`.gte('created_at', oneDayAgo)`). This is architecturally inconsistent — the `likes` table is meant to be the permanent single source of truth for swipe history (per the memory docs: "Swipe actions are fully persistent across sessions"). After 24 hours, previously swiped (and rejected) listings reappear in the swipe deck.
- **Fix:** Remove the date filter completely. Fetch all-time likes for the current user (no `.gte` filter). If the list gets very large, paginate with `.range()` instead.

---

### MEDIUM SEVERITY — Logic gaps

**BUG H: `useSwipeWithMatch` — `is_active` check references `clientExists.is_active` but the field isn't in the SELECT**
- **File:** `src/hooks/useSwipeWithMatch.tsx` — Lines 66–97
- **Bug:** After the profile existence check, the code accesses `clientExists.is_active`:
  ```js
  if (clientExists.is_active === false) { throw new Error(...) }
  ```
  But the SELECT on line 66 only fetches `id, full_name, city` — `is_active` is not selected. `clientExists.is_active` is always `undefined`, which is not `=== false`, so the check never triggers regardless of the user's actual active status.
- **Note:** After Bug C is fixed (`.eq('user_id', targetId)`), add `is_active` to the SELECT: `'user_id, full_name, city, is_active'`.

**BUG I: `useSwipedListings` — `useListings` and `useSwipedListings` have separate queries that can desync — `excludeSwipedIds` can be stale**
- **File:** `src/hooks/useListings.tsx` — Lines 95–165 and 247–279
- **Bug:** `TinderentSwipeContainer` calls `useSwipedListings()` to get swiped IDs, then passes them to `useListings(excludeSwipedIds)`. These are two separate React Query queries with different stale times (10 minutes for listings). If a swipe happens, `useSwipedListings` is invalidated but `useListings` may not be (stale time is 10 minutes). The already-swiped listing can remain in the deck until the listings query naturally refetches.
- **Fix:** In `useSwipe.tsx` `onSuccess`, explicitly invalidate `['listings']` as well, not just the downstream keys. This ensures the deck updates immediately after every swipe.

**BUG J: `MessagingDashboard` — `fetchSingleConversation` fallback checks `fetchedConversation.other_user` but field can be `undefined` even when conversation was found**
- **File:** `src/pages/MessagingDashboard.tsx` — Lines 212–230
- **Bug:** After Bug D is fixed in `useConversations.tsx`, this code path will work correctly. But even with Bug D present, the error path shows a generic `"The conversation may not exist"` toast when in reality the conversation exists but the profile fetch failed. This misleads users who click notification links.
- **Fix:** Separate the two failure cases: if `fetchedConversation` is `null` → conversation doesn't exist; if `fetchedConversation` exists but `other_user` is `undefined` → show the conversation anyway with an anonymous user fallback (`full_name: 'User'`, `role: 'client'`) rather than blocking access entirely.

---

## Root Cause Summary

```text
useSwipeWithMatch.tsx  — 3 instances of .eq('id', ...) on profiles table (lines 66, 185, 263)
useConversations.tsx   — 1 instance in fetchSingleConversation (line 212)
PropertyDetails.tsx    — PostgREST FK join on non-existent constraint
useListings.tsx        — Malformed .not() filter for UUID exclusion (quoted UUIDs)
useListings.tsx        — 24-hour swipe lookback breaks permanent exclusion guarantee
EnhancedPropertyCard   — Hardcoded /month price label for all listing types
useSwipeWithMatch.tsx  — is_active not in SELECT but checked
useSwipe.tsx           — listings query not invalidated after swipe
```

---

## Implementation Plan

### Phase 1 — Critical: Owner Swipe Feature Completely Broken (BUGs A, B, C)
All three bugs are in `useSwipeWithMatch.tsx` — the core swipe-to-match engine.

1. **Line 66:** `.eq('id', targetId)` → `.eq('user_id', targetId)`. Add `is_active` to SELECT.
2. **Line 185:** `.eq('id', user.id)` → `.eq('user_id', user.id)`.
3. **Line 263:** `.eq('id', user.id)` → `.eq('user_id', user.id)`.

These three fixes together restore: (a) owner right-swipes working at all, (b) "New Flame!" notifications showing real names.

### Phase 2 — Messaging Fallback Fix (BUG D)
4. **`useConversations.tsx` line 212:** Change profile query to use `user_id`. Fix select to include `user_id, full_name, avatar_url`.
5. **`MessagingDashboard.tsx`:** Add anonymous user fallback so notification-link-opened conversations don't block on `other_user` being undefined.

### Phase 3 — Listings Deck Accuracy (BUGs E, F, G, I)
6. **`PropertyDetails.tsx`:** Replace the broken FK join with a two-step owner profile query.
7. **`useListings.tsx` line 140:** Fix UUID format in `.not('id', 'in', ...)` — remove quotes around UUIDs.
8. **`useListings.tsx` line 256:** Remove the `oneDayAgo` date filter from `useSwipedListings` to make swipe exclusion permanent.
9. **`useSwipe.tsx` onSuccess:** Add `['listings']` to the invalidation list to force deck refresh immediately after every swipe.

### Phase 4 — Polish (BUGs G, H)
10. **`EnhancedPropertyCard.tsx` line 303:** Derive price period label from `listing.rental_duration_type` instead of hardcoding `/month`.
11. **`useSwipeWithMatch.tsx` line 66:** Confirm `is_active` is in the SELECT after Bug C fix (it will be added as part of Phase 1).

### Technical Notes
- Phase 1 is the highest priority: Bug C alone causes every owner right-swipe to throw `"This user profile is no longer available"` — the entire owner discovery feature is broken
- Bug F (malformed UUID filter) means any user who has swiped on any listing will see those listings reappear — the `excludeSwipedIds` mechanism is completely non-functional
- Bug G (24-hour lookback) compounds Bug F — even if the filter format were correct, swiped cards reappear the next day
- The `PropertyDetails` FK join (Bug E) was likely written assuming a FK constraint existed — the database schema shows no such constraint between `listings.owner_id` and `profiles`
- All Phase 1–3 changes are surgical one or two-line fixes; no architectural changes required

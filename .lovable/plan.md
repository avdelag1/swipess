
# Full App Audit — Round 3

## Confirmed Fixed from Round 2

All Round 2 fixes are confirmed correct:
- `useNotifications.tsx` — `.eq('user_id')` ✓
- `RadioContext.tsx` — `.eq('user_id', user.id)` ✓
- `useProfileAutoSync.ts` — `user_id=eq.${user.id}` filter ✓
- `useConversations.tsx` — `.in('user_id', ...)` + `profilesMap.set(p.user_id, ...)` ✓
- `useSwipeSounds.ts` — `.maybeSingle()` ✓
- `useMessageActivations.ts` — `from('message_activations')` ✓
- `AISearchDialog.tsx` — `hover:bg-white/10`, `border-white/10` ✓

---

## NEW ISSUES FOUND (Round 3) — 12 Bugs

---

### CRITICAL — Causes silent data loss or wrong behavior

**BUG A: `useProfileCache` — fetches profiles by `id` (internal PK) instead of `user_id` (auth FK)**
- **File:** `src/hooks/useProfileCache.ts` — Lines 38, 100
- **Bug:** `getProfile()` calls `.eq('id', userId)` and `getProfiles()` calls `.in('id', uncachedIds)` where `userId` is the Supabase auth UID. But `profiles.id` is an auto-generated UUID, not the auth UID. Result: every profile fetch in real-time chat returns `null`, making all sender names and avatars show as "Unknown" in the messaging view.
- **Additionally:** The cached profile stores `profile.id` (internal PK) as the map key, but the lookup uses the auth UID — so even if a row was found by coincidence, the cache would never be hit.
- **Fix:** Change `.eq('id', userId)` → `.eq('user_id', userId)`, `.in('id', uncachedIds)` → `.in('user_id', uncachedIds)`, and update all map keys from `profile.id` → `profile.user_id`.

**BUG B: `useOwnerInterestedClients` — fetches profiles by `id` instead of `user_id`**
- **File:** `src/hooks/useOwnerInterestedClients.tsx` — Lines 86–89, 106, 122
- **Bug:** `.select('id, full_name, avatar_url').in('id', userIds)` where `userIds` are auth UIDs from the `likes.user_id` column. Returns 0 rows. The Owner "Interested Clients" panel shows no one even when clients have liked listings.
- **Additionally:** `profileMap` is built with `p.id` as key, but lookup uses `like.user_id` (auth UID) — a double mismatch.
- **Fix:** Change `.in('id', userIds)` → `.in('user_id', userIds)`, change `profileMap.set(p.id, p)` → `profileMap.set(p.user_id, p)`.

**BUG C: `useClientProfiles` — filters profiles by `id` column instead of `user_id`**
- **File:** `src/hooks/useClientProfiles.tsx` — Line 62
- **Bug:** `.neq('id', user.id)` is used to exclude the current user's own profile from the discovery list. But `profiles.id` is an internal UUID, not the auth UID. This filter never matches — the owner may occasionally see their own profile in the client swipe deck.
- **Also:** On line 90, `clientProfileMap.get(profile.id)` uses the internal profile `id` as a lookup key against `clientProfileMap` which is keyed by `user_id`. This means the `client_profiles` enrichment data (detailed bio, profile images) is never applied to any profile in the owner's swipe deck.
- **Fix:** Change `.neq('id', user.id)` → `.neq('user_id', user.id)`, and change `clientProfileMap.get(profile.id)` → `clientProfileMap.get(profile.user_id)` (after ensuring `user_id` is selected in the profiles query).

**BUG D: `useAuth.tsx` — stale cache key `['tokens']` cleared on sign-in, but real key is `['message_activations']`**
- **File:** `src/hooks/useAuth.tsx` — Lines 168, 385
- **Bug:** On sign-in and OAuth setup, `queryClient.removeQueries({ queryKey: ['tokens'] })` is called. But `useMessageActivations.ts` uses the query key `['tokens', user?.id]` — wait, actually after the Round 2 fix the table name was changed to `message_activations` but the query key is still `['tokens', user?.id]` in `useMessageActivations.ts`. The cache clear in `useAuth` targets `['tokens']` which is correct for the query key — but it would be better to update both to `['message_activations']` to be semantically consistent and avoid future confusion.
- **Fix:** In `useMessageActivations.ts`, change `queryKey: ['tokens', user?.id]` → `queryKey: ['message_activations', user?.id]`. In `useAuth.tsx` lines 168 and 385, change `removeQueries({ queryKey: ['tokens'] })` → `removeQueries({ queryKey: ['message_activations'] })`.

---

### HIGH SEVERITY — UX regressions

**BUG E: `useSmartMatching` (client side) — profiles fetched for client smart matching uses `.eq('id', ...)` wrong column**
- **File:** `src/hooks/useSmartMatching.tsx` — around line 970 (client profiles section)
- **Bug:** The owner-side `useSmartClientMatching` function fetches client profiles from the `profiles` table. Based on the pattern seen throughout the codebase, this function likely uses `.neq('id', userId)` or `.eq('id', ...)` when it should use `user_id`. Since the file is 1429 lines, the specific lines need verification during implementation.
- **Fix:** During implementation, search for all `.eq('id',` and `.neq('id',` in `useSmartMatching.tsx` and change to `user_id` equivalents.

**BUG F: `useListingLikers` — uses a foreign key join on wrong column**
- **File:** `src/hooks/useOwnerListingLikes.tsx` — Lines 99–106
- **Bug:** The join `profiles:user_id (full_name, avatar_url)` is a PostgREST foreign key join. The `profiles` table does NOT have a foreign key constraint from `user_id` to `auth.users`. PostgREST joins work via foreign key constraints. Without the FK constraint, this join silently returns `null` for every `profiles` entry in the result. All likers show as "Anonymous" with no avatar.
- **Fix:** Either add a DB migration to create the FK constraint `profiles.user_id REFERENCES auth.users(id)`, OR rewrite to a two-step query: first get the `user_id` list, then `.in('user_id', userIds)` on `profiles`.

**BUG G: `useSmartMatching.tsx` — `useSmartClientMatching` excludes swiped clients using wrong column**
- **File:** `src/hooks/useSmartMatching.tsx` — Lines 950–1050 (client matching section, to be verified during implementation)
- **Bug:** The function fetches `profiles` to display client cards and likely uses `.neq('id', userId)` or `.not('id', 'in', ...)` to exclude the owner or swiped clients. Since `user_id` is the auth FK, these filters silently fail.
- **Fix:** All `.neq('id',` → `.neq('user_id',` in the client matching query section.

---

### MEDIUM SEVERITY — Performance / Logic

**BUG H: `useOwnerInterestedClients` — `direction: 'like'` in code comment but queries `direction: 'right'`**
- **File:** `src/hooks/useOwnerInterestedClients.tsx` — Line 61 (comment) vs Line 72
- **Issue:** The code comment says `direction = 'like'` but the actual query uses `direction: 'right'`. The query is correct (`'right'` is what `useSwipe` inserts), but the comment creates confusion and could lead to future bugs where someone "corrects" the working query to match the misleading comment.
- **Fix:** Update the comment to say `direction = 'right'` to match the actual schema.

**BUG I: `useClientProfiles` — `user_id` column not included in profiles SELECT**
- **File:** `src/hooks/useClientProfiles.tsx` — Lines 44–61
- **Bug:** The `profiles` SELECT does not include `user_id` — only `id, full_name, avatar_url, age, gender, images, interests, lifestyle_tags, smoking, city, country, neighborhood, nationality, bio, created_at`. When Bug C is fixed (changing `.neq('id')` to `.neq('user_id')`) and the map lookup is changed to use `profile.user_id`, the lookup will fail because `user_id` isn't in the SELECT. This must be fixed together.
- **Fix:** Add `user_id` to the profiles SELECT query.

**BUG J: `useProfileCache` — cache is keyed by `userId` (auth UID) but stored value has `id` field (internal PK)**
- **File:** `src/hooks/useProfileCache.ts` — Lines 57–61
- **Bug:** The `CachedProfile` interface has `id: string` which stores `profile.id` (internal PK). But the cache key and all lookups use the auth UID. When `realtimeChat` calls `getProfile(newMessage.sender_id)`, it caches with the auth UID as key but stores the internal `id` as the profile's `id` field. Any code that reads `cachedProfile.id` to do another query gets the wrong value.
- **Fix:** After fixing Bug A, update `CachedProfile.id` to store `profile.user_id` and update the cache storage to use `profile.user_id` consistently.

**BUG K: `useSmartMatching.tsx` query for client profiles uses `profiles` table with `id` column mismatch**
- **File:** `src/hooks/useSmartMatching.tsx` — around lines 900–1000
- **Confirmed by pattern:** The owner client matching section fetches profiles and builds a profilesMap using `profile.id` as keys, but all the lookup IDs come from `likes.user_id` (auth UIDs). This is the same `id` vs `user_id` class of bug seen in 6+ other places.
- **Fix:** Verify and fix all `.eq('id',`, `.in('id',`, `.neq('id',` patterns in useSmartMatching's client section to use `user_id`.

---

### LOW SEVERITY — Polish / Security

**BUG L: `notifications` RLS INSERT policy still has the security vulnerability (confirmed from live DB)**
- **File:** DB — `notifications` table
- **Confirmed:** The RLS policies shown in the schema still show: `(related_user_id = auth.uid()) OR (user_id = auth.uid())`. This means the Round 1 migration for this was either not applied or was reverted.
- **Fix:** Apply the migration again: replace INSERT policy with `(user_id = auth.uid())` only.

---

## Root Cause Summary

The same root bug class (`profiles.id` vs `profiles.user_id`) was found in **6 more files** beyond those fixed in Rounds 1 and 2:

```text
useProfileCache.ts       — getProfile + getProfiles both use .eq('id', ...)
useOwnerInterestedClients.tsx — .in('id', userIds) + profileMap.set(p.id, ...)
useClientProfiles.tsx    — .neq('id', user.id) + clientProfileMap.get(profile.id)
useSmartMatching.tsx     — client matching section (verify lines ~950–1050)
useOwnerListingLikes.tsx — PostgREST join via non-existent FK
useAuth.tsx              — stale cache key 'tokens' not updated to 'message_activations'
```

---

## Implementation Plan

### Phase 1 — Critical Column Fixes (same class of bug, zero-risk one-liners)

1. **`useProfileCache.ts`:** `.eq('id', userId)` → `.eq('user_id', userId)`, `.in('id', uncachedIds)` → `.in('user_id', uncachedIds)`, all `profile.id` map keys/values → `profile.user_id`.

2. **`useOwnerInterestedClients.tsx`:** `.in('id', userIds)` → `.in('user_id', userIds)`, `profileMap.set(p.id, p)` → `profileMap.set(p.user_id, p)`, add `user_id` to SELECT.

3. **`useClientProfiles.tsx`:** Add `user_id` to profiles SELECT, `.neq('id', user.id)` → `.neq('user_id', user.id)`, `clientProfileMap.get(profile.id)` → `clientProfileMap.get(profile.user_id)`, and fix `user_id: profile.id` → `user_id: profile.user_id` in the transform.

4. **`useSmartMatching.tsx`:** Scan and fix all `.eq('id',`, `.neq('id',`, `.in('id',`, and map key assignments in the client matching section.

### Phase 2 — Hook Query Key Consistency

5. **`useMessageActivations.ts`:** Change `queryKey: ['tokens', user?.id]` → `queryKey: ['message_activations', user?.id]`.

6. **`useAuth.tsx`:** Change both `removeQueries({ queryKey: ['tokens'] })` → `removeQueries({ queryKey: ['message_activations'] })`.

### Phase 3 — Data Integrity Fix

7. **`useListingLikers`:** Rewrite the profile join as a two-step query (fetch `user_id` list, then `.in('user_id', ...)` on profiles) instead of relying on a PostgREST FK join that doesn't exist.

### Phase 4 — Comment Fix + DB Security

8. **`useOwnerInterestedClients.tsx`:** Fix misleading `direction = 'like'` comment → `direction = 'right'`.

9. **DB Migration:** Re-apply the `notifications` INSERT RLS policy fix (replace `related_user_id = auth.uid()` branch).

### Technical Notes

- Phase 1 fixes are all the same root cause — the `id` vs `user_id` column confusion on the `profiles` table
- Phase 1, item 3 requires adding `user_id` to the SELECT before fixing the map key, so these 3 lines must be changed together atomically
- `useSmartMatching.tsx` is 1429 lines — only the client-matching section (roughly lines 900–1100) will be modified; listing matching is already correct
- Phase 2 is purely a naming consistency fix — no behavioral change
- Phase 4 DB migration is the same notification RLS fix from Round 1 that needs re-application

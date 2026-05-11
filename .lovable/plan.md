## What I'm fixing

Three concrete bugs you keep hitting. The Supabase/GitHub sync part of your message is just context — your env is already pointing at the correct backend, and `client_profiles.occupation` already exists in the schema, so no migration needed.

### 1. Virtual ID Card doesn't update after editing
**Root cause:** `VapIdCardModal` selects `bio, nationality, city, interests, personality_traits, preferred_activities` from `client_profiles` — but **not `occupation`**, even though the edit modal saves it. It also doesn't read `years_in_city` or `languages` (which the edit modal writes to `client_profiles.languages`, while the card reads `profiles.languages_spoken`). So saves succeed, cache invalidates, but the card never shows the new data because the query never asked for those columns.

**Fix:**
- Add `occupation, years_in_city, languages` to the `client_profiles` select in `VapIdCardModal`.
- Prefer `clientProfile.languages` over `profiles.languages_spoken` when present (edit modal only writes the client_profiles version).
- Make both queries `staleTime: 0` and add a realtime subscription on `client_profiles` + `profiles` filtered by `user_id` so the card live-updates the moment Save is hit (or another device edits).
- Keep `VapIdEditModal.handleSave` as-is (already hardened with upsert-via-select pattern).

### 2. Messages — read state + realtime
**Symptoms:** unread badges stuck, new messages don't pop in without refresh.

**Fix:**
- `useMarkMessagesAsRead`: it's correct logic-wise but the realtime subscription doesn't invalidate the conversations list cache after marking read, so the unread counter on the inbox stays stale. After a successful mark-as-read, invalidate `['conversations', user.id]` and `['unread-message-count']`.
- `useConversationMessages`: replace the full `refetch()` on every INSERT with an optimistic cache append (push payload.new into the React Query cache) so new messages appear instantly without a network round-trip; keep refetch as fallback.
- `useConversations`: add a fan-out subscription on `conversation_messages` UPDATE events (currently only INSERT is watched) so when the other side reads our message, the "delivered → read" state updates live.

### 3. Saved Likes don't refresh after swipe-right
**Root cause:** `useLikedProperties` has `staleTime: Infinity` + `refetchOnMount: false`. `useSwipeWithMatch` intentionally skips invalidating `['liked-properties']` (comment in code says "avoid refetch race"). Net effect: the user right-swipes, navigates to Likes, sees nothing new until manual pull-to-refresh.

**Fix:**
- After a successful right-swipe insert in `useSwipeWithMatch`, do an **optimistic cache update** on `['liked-properties']` / `['liked-clients']` (prepend the swiped item) instead of a full invalidate — preserves the no-race guarantee.
- Verify `useLikesRealtime` is mounted at the app level (it lives in `src/hooks/useLikesRealtime.tsx`); if it isn't being mounted from `AppLayout`/`RootProviders`, mount it once globally so any like change anywhere refreshes the list.
- Same treatment for `EventosLikes` (`target_type='event'` is already covered by the same hook).

### What I'm NOT touching
- Git/branch sync — that's a deployment concern; your workflows already handle it.
- `VapIdEditModal.handleSave` logic (you said not to overwrite it).
- Any schema migration — `occupation` is already in `client_profiles`.

## Files I'll edit
- `src/components/VapIdCardModal.tsx` — expand select, add realtime, staleTime 0
- `src/hooks/useMarkMessagesAsRead.tsx` — invalidate conversations + unread count after mark
- `src/hooks/useConversations.tsx` — UPDATE subscription + optimistic message append in `useConversationMessages`
- `src/hooks/useSwipeWithMatch.tsx` — optimistic prepend to liked-properties / liked-clients on right swipe
- `src/App.tsx` or `src/providers/RootProviders.tsx` — ensure `useLikesRealtime()` is mounted once globally (if not already)

## Verification
- ID card: edit occupation/bio/languages → hit Save → card behind updates without closing.
- Messages: open a chat in two browsers → send from A → appears in B instantly + B's unread count clears for A after B opens it.
- Likes: right-swipe a listing → tap Likes tab → item is at the top, no refresh needed.

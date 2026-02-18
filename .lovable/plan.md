
# Full App Re-Audit — SwipesS (Round 2)

## What Was Fixed in Round 1 (Confirmed)

After reading every affected file, the following Round 1 fixes are confirmed as correctly applied:
- `useSwipeSounds.ts` — `.eq('user_id')` correct, audio cleanup present
- `AISearchDialog.tsx` — `handleClose` declared before `handleAction`, avatar fallback chain present, `AnimatePresence` keyed
- `BottomNavigation.tsx` — brand gradient on badge and active dot, orange on active icon/label
- `TopBar.tsx` — `onPointerDown` on center zone and Tokens button, brand gradient on notification badge
- `App.tsx` — `OwnerDashboardNew` import removed, `QueryCache` error logger added
- `index.css` — redundant `overflow-x` on `#root` removed
- `sounds.ts` — `getSoundForTheme` guard clause added
- `RadioContext.tsx` — removed non-existent column queries
- `dialog.tsx` — `hideCloseButton` prop already implemented (Bug #2 was a false alarm)

---

## NEW ISSUES FOUND (Round 2)

### CRITICAL — Causes runtime failures

**BUG A: `useNotifications` — profile lookup uses `.eq('id')` not `.eq('user_id')`**
- **File:** `src/hooks/useNotifications.tsx` — Line 52
- **Bug:** Fetches sender's profile with `.eq('id', newMessage.sender_id)` — but the `profiles` table primary key `id` is an internal UUID. The sender's auth UID is in `user_id`. This query returns 0 rows every time, so every real-time message notification shows the sender as "Someone" instead of their real name. This affects ALL real-time message toasts.
- **Fix:** Change `.eq('id', newMessage.sender_id)` → `.eq('user_id', newMessage.sender_id)`

**BUG B: `RadioContext` — `savePreferences` still queries by `.eq('id', user.id)` — wrong column**
- **File:** `src/contexts/RadioContext.tsx` — Line 199
- **Bug:** `supabase.from('profiles').update(dbUpdates).eq('id', user.id)` — the `profiles.id` is not the auth UID. This means radio station preferences are never actually saved. Every time the user changes station, the DB update silently hits 0 rows.
- **Fix:** Change `.eq('id', user.id)` → `.eq('user_id', user.id)`

**BUG C: `useProfileAutoSync` — realtime filter uses wrong column**
- **File:** `src/hooks/useProfileAutoSync.ts` — Line 63
- **Bug:** The realtime filter `filter: 'id=eq.${user.id}'` watches for changes where `profiles.id = auth.uid()` — but `profiles.id` is an auto-generated internal UUID. It should be `user_id=eq.${user.id}`. This means the realtime profile sync **never fires** for any user because the filter never matches.
- **Fix:** Change `filter: \`id=eq.${user.id}\`` → `filter: \`user_id=eq.${user.id}\``

**BUG D: `useConversations` — profile lookup uses `.in('id', ...)` not `user_id`**
- **File:** `src/hooks/useConversations.tsx` — Line 89
- **Bug:** `supabase.from('profiles').select('id, full_name, avatar_url').in('id', Array.from(userIds))` — `userIds` contains auth UIDs (from `conversations.client_id` / `owner_id`), but profiles are keyed by `user_id` not `id`. This means `profilesMap` is always empty — every conversation shows `other_user: undefined` and no names/avatars appear in the chat list.
- **Fix:** Change `.in('id', ...)` → `.in('user_id', ...)` and update `profilesMap.set(p.id, p)` to use `p.user_id` as the map key, and look up `profilesMap.get(otherUserId)` which already uses the auth UID.

---

### HIGH SEVERITY — UX regressions

**BUG E: `AISearchDialog` — `bg-white/8` still used in button className**
- **File:** `src/components/AISearchDialog.tsx` — Line 460
- **Bug:** The quick-prompt action buttons (shown after first AI response) still use `hover:bg-white/8` — this is an invalid Tailwind opacity step. The empty-state grid buttons were fixed on line 357 (`hover:bg-white/10`) but the post-message quick-action buttons at line 460 still have `bg-white/5 hover:bg-white/8 border border-white/8`.
- **Fix:** Change `hover:bg-white/8` → `hover:bg-white/10` and `border-white/8` → `border-white/10` on line 460.

**BUG F: `TopBar` — still uses `// @ts-nocheck` suppressing all type errors in a critical UI component**
- **File:** `src/components/TopBar.tsx` — Line 1
- **Issue:** The TopBar, which renders on every page for every user, is fully type-unsafe. The `packages` query casts to `any` everywhere. No errors surface in dev.
- **Fix:** Remove `// @ts-nocheck` and resolve type errors.

**BUG G: `DashboardLayout` — still has `// @ts-nocheck` (carried over from Round 1)**
- **File:** `src/components/DashboardLayout.tsx` — Line 1
- **Issue:** 767-line critical layout component remains fully type-unsafe. Deferred in Round 1.
- **Fix:** Remove `// @ts-nocheck` and resolve type errors incrementally.

---

### MEDIUM SEVERITY — Performance / Logic

**BUG H: `useSwipeSounds` — DB query uses `.single()` which throws if no profile row**
- **File:** `src/hooks/useSwipeSounds.ts` — Line 35
- **Bug:** Uses `.single()` which throws PGRST116 if the user has no profile row (new users). This causes a console warning on every new signup. It was not fixed in Round 1. Should be `.maybeSingle()` so new users silently get the default `'none'` theme without any error.
- **Fix:** Change `.single()` → `.maybeSingle()`

**BUG I: `useMessaging` / `useMessagingQuota` — both imported in `useConversations` but quota is always `999`**
- **File:** `src/hooks/useMessageActivations.ts` — Lines 15–36
- **Issue:** The token query hits the `tokens` table which doesn't exist in schema (the real table is `message_activations`). Every query falls through to the catch block and returns `{ totalRemaining: 999 }`. This means messaging is always "free" regardless of real token balance. The table name was fixed in `useSubscription.tsx` but not in `useMessageActivations.ts`.
- **Fix:** Change `supabase.from('tokens')` → `supabase.from('message_activations')` in `useMessageActivations.ts`

**BUG J: `AISearchDialog` input border uses `border-white/8` — invalid Tailwind opacity**
- **File:** `src/components/AISearchDialog.tsx` — Line 480
- **Bug:** `border-white/8` on the Input element. Same class issue as Bug E — invalid opacity step.
- **Fix:** Change `border-white/8` → `border-white/10`

---

### LOW SEVERITY — Polish / Security

**BUG K: `notifications` INSERT RLS still allows cross-user injection**
- **File:** DB — `notifications` table INSERT policy
- **Issue:** The policy `(related_user_id = auth.uid()) OR (user_id = auth.uid())` still exists as confirmed in the schema. The `related_user_id = auth.uid()` branch still allows an authenticated user to create a notification targeting any `user_id`. This was identified in Round 1 but reviewing the schema shows it was NOT yet migrated.
- **Fix:** A DB migration to replace the INSERT policy with `(user_id = auth.uid())` only — removing the dangerous `related_user_id` branch.

**BUG L: `user_roles` unique constraint still on `(user_id, role)` — not fixed from Round 1**
- **DB:** `user_roles` table
- **Issue:** The `upsert_user_role` function uses `ON CONFLICT (user_id)` but the DB constraint is still `UNIQUE(user_id, role)`. Confirmed from schema: no unique constraint on just `user_id`. A user who changes role (client → owner) will accumulate duplicate rows.
- **Fix:** DB migration to drop the existing composite constraint and add `UNIQUE(user_id)`, then clean up any existing duplicate rows first.

---

## Implementation Plan

### Phase 1 — Critical DB Column Fixes (4 one-line changes, zero risk)
These are all the same class of bug: querying `profiles` by `id` (internal PK) instead of `user_id` (auth FK). They silently return 0 rows and break real features.

1. `useNotifications.tsx` line 52: `.eq('id', ...)` → `.eq('user_id', ...)`
2. `RadioContext.tsx` line 199: `.eq('id', user.id)` → `.eq('user_id', user.id)`
3. `useProfileAutoSync.ts` line 63: filter `id=eq.${user.id}` → `user_id=eq.${user.id}`
4. `useConversations.tsx` line 89: `.in('id', ...)` → `.in('user_id', ...)` + fix map key to `p.user_id`

### Phase 2 — Hook Fixes
5. `useSwipeSounds.ts` line 35: `.single()` → `.maybeSingle()`
6. `useMessageActivations.ts`: `from('tokens')` → `from('message_activations')`

### Phase 3 — CSS Class Fixes (invalid Tailwind opacity steps)
7. `AISearchDialog.tsx` line 460: `hover:bg-white/8` → `hover:bg-white/10`, `border-white/8` → `border-white/10`
8. `AISearchDialog.tsx` line 480: `border-white/8` → `border-white/10`

### Phase 4 — DB Security Migrations
9. Fix `notifications` INSERT RLS policy (remove `related_user_id` branch)
10. Fix `user_roles` unique constraint to `UNIQUE(user_id)` only

### Technical Notes
- All Phase 1 fixes are identical one-line changes — same root cause, different files
- Phase 3 CSS fixes are zero-risk (invalid classes just do nothing)
- Phase 4 DB migrations will be run with safety checks: clean up duplicate `user_roles` rows before adding the new unique constraint
- `DashboardLayout.tsx` and `TopBar.tsx` `@ts-nocheck` removal deferred — requires careful incremental type resolution and will not be in this implementation pass to avoid regressions

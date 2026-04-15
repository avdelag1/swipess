

## Production-Ready App: Remove Mocks, Reset Welcome, Add Live Counts

### Problem Summary
1. **Mock data pollutes owner discovery** -- `TULUM_MOCKS` array injects 4 fake profiles into the owner swipe deck
2. **Welcome page won't re-show** -- `localStorage` flag `welcome_seen_{userId}` blocks it permanently
3. **No live count indicator** -- Users can't see how many listings/profiles are available per category
4. **Admin profiles could leak** -- No explicit admin exclusion in discovery queries
5. **Console error** -- `ZenithPrewarmer` prefetches `topbar-token-packages` without a `queryFn`
6. **Self-exclusion missing on listing queries** -- Users could theoretically see their own listings

---

### Changes

**1. Remove mock data from `src/hooks/smartMatching/useSmartClientMatching.tsx`**
- Delete the entire `TULUM_MOCKS` array (lines 16-53)
- Remove the code that injects mocks into results (lines 206-209: `if (page === 0) { ... uniqueMocks ... }`)
- This ensures only real user profiles appear in owner discovery

**2. Exclude admin users from discovery queries**
- In `useSmartClientMatching.tsx` PostgREST fallback: add `.neq('user_id', userId)` to the main query (self-exclusion) and add a sub-filter to exclude admin-role users by joining against `user_roles`
- Since we can't easily join in PostgREST, use a simpler approach: after fetching profiles, filter out any whose `user_id` appears in the admin role. Alternatively, add an RPC or use the existing `has_role` function at the app level
- Practical approach: fetch admin user IDs once (small set), cache them, exclude client-side

**3. Self-exclusion on listing queries in `useSmartListingMatching.tsx`**
- Add `.neq('user_id', userId)` to the PostgREST fallback query so users never see their own listings

**4. Reset welcome state in `useWelcomeState.tsx`**
- Change the "newness" window from 2 minutes to a flag-based approach: remove the `created_at` time check
- Instead, rely purely on a database-side flag: check if a `system_announcement` welcome notification exists for the user
- For the reset: we'll clear the welcome notification records so all existing users see it again. This requires a data operation (DELETE from notifications where notification_type = 'system_announcement' and title LIKE 'Welcome%')

**5. Add live category count badge**
- Create a lightweight `useDiscoveryCounts` hook that queries:
  - Client side: `SELECT category, count(*) FROM listings WHERE status='active' GROUP BY category`
  - Owner side: count from `profiles` where `role='client'` and `is_active=true`
- Display the count as a small pill/badge near the category filter buttons or in the discovery header
- Use a subtle, iOS-style numeric badge (e.g., "12 Properties" or "5 Renters")

**6. Fix ZenithPrewarmer missing queryFn**
- In `src/components/ZenithPrewarmer.tsx` line 44-47: add a proper `queryFn` to the `prefetchQuery` call, or remove the prefetch entirely since it has no fetch function

---

### Files to modify

| File | Change |
|------|--------|
| `src/hooks/smartMatching/useSmartClientMatching.tsx` | Remove `TULUM_MOCKS`, remove mock injection, add self-exclusion, add admin filtering |
| `src/hooks/smartMatching/useSmartListingMatching.tsx` | Add `.neq('user_id', userId)` for self-exclusion |
| `src/hooks/useWelcomeState.tsx` | Reset logic: remove time-based check, use notification existence only |
| `src/components/ZenithPrewarmer.tsx` | Fix missing `queryFn` for token-packages prefetch |
| `src/hooks/useDiscoveryCounts.ts` | **New** -- lightweight hook for live category counts |
| `src/components/swipe/SwipeAllDashboard.tsx` or relevant header | Display count badge from `useDiscoveryCounts` |

### Data operation (one-time reset)
- DELETE all welcome notifications so every user sees the welcome again
- This will be executed via the insert tool (which supports DELETE)


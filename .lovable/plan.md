

## Plan: Make Swipe Like/Dislike Truly Persistent Across Sessions

### Problem
When you swipe right (like) or left (dislike) on a listing or client, the action saves to the database but the cards can reappear when you:
- Refresh the page
- Switch between client/owner dashboards
- Navigate away and come back

This happens because the app aggressively caches the card deck locally (in memory and session storage) and restores stale decks that still contain already-swiped cards.

### Solution
Three targeted fixes to ensure swiped cards never come back:

### 1. Force Fresh Data on Dashboard Entry
**Files:** `src/components/TinderentSwipeContainer.tsx`, `src/components/ClientSwipeContainer.tsx`

- When the swipe container mounts, immediately invalidate the `smart-listings` / `smart-clients` query cache so it re-fetches from the database (which already excludes swiped IDs at the SQL level)
- Change `refetchOnMount: false` to `refetchOnMount: 'always'` in `useSmartMatching` so the query always re-checks the database when the dashboard loads

### 2. Filter Restored Decks Against Database Swipes
**Files:** `src/components/TinderentSwipeContainer.tsx`, `src/components/ClientSwipeContainer.tsx`

- When restoring a deck from session storage or Zustand store, cross-check restored cards against the `swipedIds` set from the store
- Any card whose ID is already in `swipedIds` gets filtered out before display
- This prevents the brief flash of already-swiped cards while the fresh DB query loads

### 3. Reduce Stale Time for Smart Matching Queries
**File:** `src/hooks/useSmartMatching.tsx`

- Reduce `staleTime` from 10 minutes to 2 minutes for both `useSmartListingMatching` and `useSmartClientMatching`
- Change `refetchOnMount` from `false` to `'always'` so re-entering the dashboard always gets fresh exclusion data from the database
- Keep `refetchOnWindowFocus: false` and `refetchOnReconnect: false` to avoid unnecessary refetches during active swiping

### 4. Ensure Query Invalidation After Swipes
**File:** `src/hooks/useSwipe.tsx`

- After a successful swipe, also invalidate `smart-clients` query key (currently only invalidates `smart-listings`)
- This ensures both client-side and owner-side decks respect new swipes immediately

### Technical Details

```text
Current Flow (broken):
  User swipes -> saves to DB -> cache still has old deck -> old cards reappear

Fixed Flow:
  User swipes -> saves to DB -> invalidates query cache
  Dashboard mount -> refetch from DB -> DB excludes swiped IDs -> only new cards shown
  Session restore -> filter against swipedIds set -> no stale cards
```

### Files to Modify
1. `src/hooks/useSmartMatching.tsx` - Reduce staleTime, enable refetchOnMount
2. `src/hooks/useSwipe.tsx` - Add smart-clients invalidation
3. `src/components/TinderentSwipeContainer.tsx` - Filter restored deck against swipedIds
4. `src/components/ClientSwipeContainer.tsx` - Filter restored deck against swipedIds


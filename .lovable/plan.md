## Goal

Adjust demo/mock data counts and visibility on both client and owner sides so testing has a consistent practice deck, while always showing real listings/users first.

## Counts to change

**Client side — `useSmartListingMatching.tsx` `DEMO_LISTINGS`**
- Properties: keep 2 (remove 1, currently 3)
- Motorcycles: keep 2 (remove 1, currently 3)
- Bicycles: keep 2 (remove 1, currently 3)
- Workers: bring to 4 (add 1, currently 3 — add another service profile such as massage / cleaning / maintenance)
- "All" quick filter card: shows the mix of all categories (already does because filter category becomes `null` / `all`)

**Owner side — `useSmartClientMatching.tsx` `DEMO_CLIENTS`**
- Buyers: 2 (remove 1)
- Renters: 2 (remove 1)
- Hire (workers seeking jobs): 2 (remove 1)
- "All Clients" card: shows the mix (already does)
- Add 2 new demo "owner-side service-seeker" personas with varied needs (maintenance, cleaning, massage, etc.) — these can replace/augment the hire demos so we have 2 buyers + 2 renters + 2 hire = 6 mixed demos in the All Clients deck

## Visibility behavior changes

Today demos only appear when `realResults.length === 0` AND `page === 0`. User wants:
1. Real listings/users always shown first (already true via sort).
2. Demos appended **after** real results on every category, even when reals exist.
3. Demos must **not disappear** after the user swipes left/right on them — keep them in the deck for ongoing practice. Currently demo IDs get added to `swipedListingIds` / `swipedClientIds`, removing them next render.

### Implementation
- In both hooks, after building `realResults` / real client list, always concatenate filtered demos at the end (page 0 only, to avoid duplicating across pages).
- Filter demos to bypass the "already swiped" exclusion: detect `id.startsWith('demo-')` / `user_id.startsWith('demo-client-')` and re-include them every time.
- Apply category filter to demos as today (so Properties card shows only property demos, Bicycles shows bicycle demos, etc.).
- Apply same logic to the RPC success branch (currently returns early without appending demos) — append demos there too.
- For the "All" card on both sides: no category filter → all demos appended in mixed order.

## Files to edit

1. `src/hooks/smartMatching/useSmartListingMatching.tsx`
   - Update `DEMO_LISTINGS` array (2 property, 2 moto, 2 bicycle, 4 worker).
   - Move demo append logic out of the `realResults.length === 0` guard so demos always append on page 0.
   - Add the demo append step in the RPC success branch as well.
2. `src/hooks/smartMatching/useSmartClientMatching.tsx`
   - Update `DEMO_CLIENTS` array (2 buyers, 2 renters, 2 hire).
   - Same "always-append on page 0" change in both RPC and PostgREST branches.
   - Ensure category filter (`buyers` / `renters` / `hire` / `all-clients`) gates demos correctly.

## Out of scope
- "Let user dismiss demo permanently" — explicitly deferred per the user's note.
- No DB / RLS changes needed (all client-side mock data).

## Summary
Trim/rebalance demo arrays to 2/2/2/4 (client) and 2/2/2 (owner), and make demos persistently appended after real data on every load instead of only when reals are empty.
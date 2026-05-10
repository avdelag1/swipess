## Plan

Fix the PWA swipe experience so real backend listings show reliably, client/owner decks open correctly, and the phone card nearly fills the screen with rounded corners.

### 1. Fix listing feed connection
- Update the client listing matching hook so it always queries the real backend listings table first.
- Keep the existing backend RPC as an optimization, but do not let missing/empty RPC results make the deck look empty.
- Make the fallback query include all active listings, with proper self-exclusion and category normalization.
- Remove overly fragile deck filtering that can hide valid cards when categories are restored from PWA storage.

### 2. Fix owner-side matching visibility
- Add a safe fallback for owner discovery because the backend currently has `user_roles` as `client`, while `profiles.role` counts are empty.
- Stop relying only on `profiles.role` for owner/client discovery.
- Use `user_roles` as the source of truth, then merge profile/client profile data so owner swipe cards can show real users when available.

### 3. Stabilize PWA deck state
- When real data arrives, force-seed the empty deck immediately instead of waiting for extra taps or stale session state.
- Clear stale session deck state when filters/category/mode change.
- Ensure PWA cache/service-worker behavior keeps backend API requests network-first and does not serve old empty data.

### 4. Make mobile swipe cards cover the phone screen
- Adjust the swipe deck frame and `SimpleSwipeCard` radius/size so cards fill almost the entire phone viewport while keeping premium rounded corners.
- Preserve bottom action buttons and nav safe-area spacing so controls remain tappable.
- Apply the same near-full-screen card treatment for both client listing cards and owner client cards.

### 5. Keep popups/nav behavior clean
- Keep AI Chat, AI Listing, ID Card, Tokens, and filters as mutually exclusive overlays.
- Make modal nav icons visibly active when their popup is open.
- Ensure tapping any normal route icon closes open popup windows so the next page is visible.

### Technical notes
- Files likely touched: `useSmartListingMatching.tsx`, `useSmartClientMatching.tsx`, `SwipessSwipeContainer.tsx`, `SimpleSwipeCard.tsx`, and possibly `BottomNavigation.tsx`/`AppLayout.tsx` if overlay state needs tightening.
- No database schema change is expected unless the live RLS checks show frontend users still cannot read listings after the frontend fixes.
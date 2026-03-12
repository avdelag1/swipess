

# Plan: Swipe-Only Dashboards + Move MyHub to Profile Pages + Store Gemini API Key

## What You Want (Summary)
- Both `/client/dashboard` and `/owner/dashboard` should show **only the swipe cards** (like Tinder)
- The MyHub content (profile header, activity feed, quick filters) moves **inside the profile pages**
- Store your Gemini API key as a backend secret for AI features

## Changes

### 1. Store the Gemini API Key
Add your Google/Gemini API key (`AIzaSyAYmqLXiAtZ5RLznHOhhq-KAkf5IUjFU0E`) as a secret called `GOOGLE_API_KEY` in the backend. The current AI orchestrator uses the Lovable Gateway (which already works), but this key will be available if we need direct Gemini API calls later.

### 2. Make Dashboards Swipe-Only

**`src/App.tsx`**:
- Change `/client/dashboard` from `<MyHub />` to `<ClientDashboard />` (swipe cards only)
- Change `/owner/dashboard` from `<MyHub />` to `<EnhancedOwnerDashboard />` (owner swipe cards only)

**`src/pages/ClientDashboard.tsx`**:
- Already renders `<SwipessSwipeContainer />` — this is exactly what we want. No changes needed.

**`src/components/EnhancedOwnerDashboard.tsx`**:
- Already renders `<ClientSwipeContainer />` for owner card swiping. No changes needed.

### 3. Move MyHub Content into Profile Pages

**`src/pages/ClientProfileNew.tsx`** (client profile):
- Add `<MyHubProfileHeader />` at the top (unified presence card)
- Add `<MyHubQuickFilters />` below the profile header
- Add `<MyHubActivityFeed />` section with "Marketplace Feed" label

**`src/pages/OwnerProfileNew.tsx`** (owner profile):
- Same additions: `<MyHubProfileHeader />`, `<MyHubQuickFilters />`, `<MyHubActivityFeed />`

### 4. Keep MyHub.tsx file
We keep the file for now but it won't be used by any route. Can be cleaned up later.

## Files to Modify
1. `src/App.tsx` — swap route elements from MyHub to swipe containers
2. `src/pages/ClientProfileNew.tsx` — add MyHub sections
3. `src/pages/OwnerProfileNew.tsx` — add MyHub sections

## Files NOT Modified
- `src/components/SwipessSwipeContainer.tsx` — already works standalone
- `src/components/EnhancedOwnerDashboard.tsx` — already works standalone
- `src/state/filterStore.ts` — no changes needed
- `src/hooks/useFilterPersistence.ts` — no changes needed

## Expected Result
- Tapping "Explore" (client) or "Dashboard" (owner) in bottom nav → shows **full-screen swipe cards** immediately
- Profile pages show the hub content: your profile card, quick category filters, activity feed
- AI orchestrator has access to your Gemini key



## Fix: Quick Filter Not Updating Swipe Cards

### Problem
When you tap a category like "Motorcycle" in the Quick Filter, the filter store updates correctly, but the swipe cards never change because the filters are not being passed to the data-fetching logic.

The flow is broken here:
1. QuickFilterDropdown updates the filter store (works)
2. ClientDashboard renders TinderentSwipeContainer with NO filters prop (broken link)
3. TinderentSwipeContainer queries listings with `undefined` filters, so it always fetches everything

### Solution
Connect the filter store to the swipe container so category changes actually filter the query.

### Technical Details

**File: `src/pages/ClientDashboard.tsx`**
- Import `useFilterStore` from the filter store
- Read `getListingFilters()` from the store to get the current filter state
- Also subscribe to `filterVersion` so the component re-renders when filters change
- Pass the resulting `ListingFilters` object to `TinderentSwipeContainer` via its `filters` prop
- Merge any externally passed `filters` prop with the store filters (store takes priority)

**File: `src/components/TinderentSwipeContainer.tsx`** (minor)
- No structural changes needed -- it already accepts and uses a `filters` prop correctly
- The existing filter-change detection (lines 316-365 and 540-570) will automatically reset the deck and refetch when the store-derived filters change

This is a one-file fix (ClientDashboard.tsx) that bridges the gap between the filter UI and the data layer.



# Fix: React Error #185 (Infinite Re-render Loop) on Dashboard Routes

## Root Cause Analysis

After tracing the full component tree (`PersistentDashboardLayout` → `DashboardLayout` → `AnimatedOutlet` → `MyHub` → `ClientDashboard` → `SwipessSwipeContainer`), the crash is caused by **cascading filter object recreation** that compounds into a render storm:

### The Chain Reaction

1. **`useFilterPersistence`** (in `PersistentDashboardLayout`) restores saved filters on mount → calls `setCategories()`, `setListingType()`, etc. — each call bumps `filterVersion` independently
2. **`MyHub`** subscribes to `filterVersion` (line 25) and calls `getListingFilters()` in a `useMemo` (line 27) — creates a **new object** on every version bump
3. **`ClientDashboard`** ALSO subscribes to `filterVersion` (line 8) and creates ANOTHER new filter object via `getListingFilters()` + merges with the prop from MyHub — producing yet ANOTHER new object
4. **`SwipessSwipeContainer`** receives new `filters` prop → `filterSignature` useMemo re-runs (dep: `[filters]`), and the filter hydration effect (lines 356-389) ALSO tries to set filters from `client_filter_preferences` DB table
5. **Competing hydration**: Two async hydration paths (`useFilterPersistence` and `SwipessSwipeContainer` line 356-389) race to set the same store values, each bumping `filterVersion` and triggering the whole chain again
6. **Unstable selectors**: `useFilterActions()` and `useQuickFilters()` return new `{}` objects on every store update (no shallow comparison), causing unnecessary re-renders of `MyHubQuickFilters` and other consumers, compounding the storm

### Additionally: Double Animation Wrapper
`DashboardLayout` wraps children in `<motion.div key={location.pathname}>` (line 629), and `AnimatedOutlet` wraps the outlet in `<motion.div key={location.key}>`. This double-wrapping forces unnecessary unmount/remount cycles.

## Fix Plan (6 files)

### 1. `src/components/SwipessSwipeContainer.tsx`
- **Remove competing filter hydration** (lines 356-389): Delete the `useEffect` that fetches from `client_filter_preferences` and calls `setCategories()`. `useFilterPersistence` is already handling this.
- **Read filters from Zustand store directly** instead of relying on props. Add store selectors for `categories`, `listingType`, etc., and build `stableFilters` from store state + props fallback.
- This eliminates the prop-drilling chain that creates new objects on every `filterVersion` bump.

### 2. `src/pages/MyHub.tsx`
- **Remove `filterVersion` subscription** (line 25) and `getListingFilters` call (lines 26-27).
- Pass `undefined` or no filters to `ClientDashboard` — it will read from the store directly.
- This stops MyHub from re-rendering on every filter change and creating new object references.

### 3. `src/pages/ClientDashboard.tsx`
- **Remove `filterVersion` subscription** and `getListingFilters` / `mergedFilters` computation (lines 8-10).
- Pass `filters={undefined}` to `SwipessSwipeContainer` or let it use its own store reads.
- Simplify to a thin wrapper.

### 4. `src/state/filterStore.ts`
- **Fix `useFilterActions` selector** (line 389): Add `shallow` from `zustand/shallow` as the equality function. This prevents re-renders when action function references haven't changed.
- **Fix `useQuickFilters` selector** (line 381): Same — add `shallow` comparison.

### 5. `src/components/DashboardLayout.tsx`
- **Remove the outer `motion.div key={location.pathname}`** wrapper (lines 629-637). The `AnimatedOutlet` already handles page transitions with its own `key={location.key}`. The double wrapper causes unnecessary remounts and animation conflicts.
- Replace with a plain `<div>` or just render `{enhancedChildren}` directly.

### 6. `src/hooks/useFilterPersistence.ts`
- **Guard the save effect** more robustly: Track restore completion with a state flag (not just ref) so that the save effect waits until restore is truly done before watching `filterVersion`.
- **Skip save on initial mount**: Add a `didMountRef` to skip the first `filterVersion` trigger (which is always the restore itself).

## Expected Outcome
- No more React Error #185 on `/client/dashboard` or `/owner/dashboard`
- Filter state managed by single hydration path (`useFilterPersistence`)
- No cascading object recreation through the component tree
- Stable Zustand selectors prevent unnecessary re-renders
- Dashboard loads instantly with correct filter state


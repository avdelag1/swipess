

# Full App Audit: Filters, Matching, Users, Workers — Bug Fix Plan

## Audit Summary

After a deep review of the filter pipeline (Zustand store → persistence → smart matching → swipe containers), the database schema, RLS policies, and component wiring, the system is architecturally sound. However, I identified several concrete issues that need fixing:

---

## Issues Found

### 1. `ListingFilters` type mismatch between `types.ts` and `smartMatching/types.ts`

**Problem**: There are TWO separate `ListingFilters` interfaces:
- `src/types/filters.ts` — used by filterStore and QuickFilterBar
- `src/hooks/smartMatching/types.ts` — used by useSmartListingMatching and SwipessSwipeContainer

The smartMatching version includes worker-specific fields (`serviceCategory`, `workTypes`, `daysAvailable`, `skills`, `scheduleTypes`, etc.) that the main `types/filters.ts` version lacks. The filterStore's `getListingFilters()` returns the `types/filters.ts` shape, but `useSmartListingMatching` reads worker filter fields from `smartMatching/types.ts`. This means worker/service filters from advanced filters may silently get dropped when passed through the store.

**Fix**: Add the missing worker-specific fields to `src/types/filters.ts` `ListingFilters` so it's a superset. Then the filterStore's `getListingFilters()` can include them.

### 2. `filterStore.getListingFilters()` doesn't pass `ageRange`, `budgetRange`, `nationalities` to client matching

**Problem**: The store has `clientAgeRange`, `clientBudgetRange`, `clientNationalities` but `getListingFilters()` outputs them as `ageRange`, `budgetRange`, `nationalities`. However, `useSmartClientMatching` reads from `ClientFilters` interface which expects those exact field names. The connection works — BUT the `EnhancedOwnerDashboard` merges filters with `{ ...filters, ...storeFilters }`. If `filters` prop is `undefined` (the default), the `storeFilters` demographic fields ARE passed correctly. This path is fine.

**Status**: Working correctly. No fix needed.

### 3. Owner filters hydration race condition in `EnhancedOwnerDashboard`

**Problem**: The `hydratedRef` guard only checks `ownerPrefs` truthiness, but `ownerPrefs` may initially be `undefined` while loading, then become `null` if no preferences exist. The `hydratedRef.current = true` fires once on the first non-nullish value, which is correct. However, if the store already has a gender set (e.g. from `useFilterPersistence` restoring a saved filter), the DB prefs should NOT overwrite it — and indeed the `storeGender === 'any'` check handles this.

**Status**: Working correctly. No fix needed.

### 4. Duplicate `PrefetchScheduler` class definition

**Problem**: `PrefetchScheduler` is defined identically in both `SwipessSwipeContainer.tsx` (line 184) and `ClientSwipeContainer.tsx` (line 45). This is dead code duplication — not a bug, but increases bundle size.

**Fix**: Extract to a shared utility.

### 5. `useNavigationGuard` duplicated

**Problem**: Same `useNavigationGuard` hook in both swipe containers. Same fix — extract to shared.

### 6. Missing `category` prop on `ClientSwipeContainer` in `EnhancedOwnerDashboard`

**Problem**: `EnhancedOwnerDashboard` renders `<ClientSwipeContainer>` without passing a `category` prop, so it defaults to `'default'`. This means the owner swipe deck store key is always `'default'` regardless of which category filter the owner has active. When the owner switches between property/services/moto categories, the deck cache isn't keyed per category — old cached profiles from a different category context may persist.

**Fix**: Pass the active category from filters to `ClientSwipeContainer`:
```tsx
<ClientSwipeContainer
  category={filterCategory || 'default'}
  ...
/>
```

### 7. `useSmartClientMatching` fetches ALL client_profiles (limit 200, no user_id filter)

**Problem** (line 158-161): The supplementary query to `client_profiles` uses `.limit(200)` with no user filtering. If there are more than 200 client profiles in the database, some profiles won't get enriched data. This is a scalability issue — not a bug today but will cause missing data as the user base grows.

**Fix**: Filter `client_profiles` query to only fetch profiles for the user_ids returned from the `profiles` query, using `.in('user_id', profileUserIds)`.

### 8. `normalizeCategoryName` doesn't handle 'motorcycle' → 'motorcycle' explicitly

**Problem**: In `types/filters.ts`, the `categoryToDatabase` map has `'motorcycle': 'motorcycle'` which is correct. But `normalizeCategoryName` strips trailing 's' unless the input is 'services'. If someone passes 'motorcycles' (plural), it becomes 'motorcycle' after stripping 's', then looks up in the map — this works. No bug here.

**Status**: Working correctly.

---

## Implementation Plan

### File 1: `src/types/filters.ts`
Add missing worker-specific filter fields to `ListingFilters` interface to match what `smartMatching/types.ts` expects:
- `serviceCategory`, `workTypes`, `scheduleTypes`, `daysAvailable`, `timeSlotsAvailable`, `locationTypes`, `experienceLevel`, `skills`, `certifications`
- `offersEmergencyService`, `backgroundCheckVerified`, `insuranceVerified` (booleans)

### File 2: `src/components/EnhancedOwnerDashboard.tsx`
Pass the active filter category to `ClientSwipeContainer` so deck caching is keyed per category:
```tsx
<ClientSwipeContainer
  category={filterCategory || 'default'}
```

### File 3: `src/hooks/smartMatching/useSmartClientMatching.tsx`
Fix the `client_profiles` query to scope by user IDs from the profiles result instead of a blanket `.limit(200)`:
```tsx
const profileUserIds = profiles.map(p => p.user_id);
const { data: clientProfileData } = await supabase
  .from('client_profiles')
  .select('...')
  .in('user_id', profileUserIds);
```

### File 4: `src/lib/swipe/PrefetchScheduler.ts` (new shared utility)
Extract the duplicated `PrefetchScheduler` class and `useNavigationGuard` hook to shared files, then update imports in both `SwipessSwipeContainer.tsx` and `ClientSwipeContainer.tsx`.

---

## What's Already Working Well
- Filter store → swipe container pipeline is correctly wired
- Category normalization (services ↔ worker, moto ↔ motorcycle) is comprehensive
- RLS policies are properly scoped on all tables
- Filter persistence saves/restores active filters correctly
- Left swipe 3-day cooldown logic is implemented correctly
- Premium tier boost ordering works
- Owner demographic filters (gender, age, budget, nationality) flow through correctly


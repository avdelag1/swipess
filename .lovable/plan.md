

# Audit Results: Remaining Filter & Listing Connection Bugs

## Bug 1 — CRITICAL: AdvancedFilters → SwipeContainer worker filters are lost

**Root cause:** `AdvancedFilters.handleApply()` (line 82-101) prefixes all filter keys with the category name: `services_service_categories`, `services_work_types`, `services_days_available`, etc. But `DashboardLayout.handleApplyFilters()` (line 381-411) does NOT unprefix them — it just passes the raw object with prefixed keys to `setAppliedFilters`. Then `combinedFilters` (line 432-467) spreads these into the final filter object. Finally, `useSmartListingMatching` expects unprefixed keys: `serviceCategory`, `workTypes`, `daysAvailable`, `skills`.

**Result:** Worker filters selected in AdvancedFilters never reach the swipe deck query. Every worker-specific filter is silently ignored.

**Fix:** In `DashboardLayout.handleApplyFilters`, extract the `services_` prefixed keys and map them to the field names that `useSmartListingMatching` expects. Alternatively, update `combinedFilters` to detect and unprefix category-specific keys when the active category matches.

## Bug 2 — HIGH: `ListingFilters` type missing worker filter fields

**Root cause:** `ListingFilters` in `types.ts` has no fields for `serviceCategory`, `workTypes`, `scheduleTypes`, `daysAvailable`, `timeSlotsAvailable`, `locationTypes`, `experienceLevel`, `skills`, `certifications`. These are passed as `any` and work at runtime because of `effectiveFilters` casting, but the type mismatch means:
- No TypeScript safety for these filters
- `filtersKey` in `useSmartListingMatching` (line 39-45) does NOT include worker filter fields in the cache key, so changing worker filters won't trigger a re-fetch

**Fix:** Add worker filter fields to `ListingFilters` interface and include them in `filtersKey`.

## Bug 3 — MEDIUM: `filtersKey` cache key ignores worker filters

**Root cause:** Lines 39-45 of `useSmartListingMatching` only include `category`, `categories`, `listingType`, `priceRange`, `propertyType` in the query key. Worker-specific filters (`serviceCategory`, `workTypes`, `daysAvailable`, `skills`, `experienceLevel`) are not in the key. Changing these filters won't trigger a new query — stale results persist.

**Fix:** Add worker filter fields to the `filtersKey` serialization.

## Bug 4 — LOW: SavedSearches display doesn't show worker filter details

`SavedSearches.tsx` (lines 111-142) only displays `client_types`, `min_budget`, `max_budget`, `min_age`, `max_age`, `lifestyle_tags`, `preferred_occupations` from `filter_data`. Worker-specific fields (service categories, skills, availability) saved in `filter_data` are invisible to the user.

**Fix:** Add badges for worker filter fields in the SavedSearches display.

---

## Files to Modify

| File | Bug | Change |
|------|-----|--------|
| `src/hooks/smartMatching/types.ts` | 2 | Add `serviceCategory`, `workTypes`, `scheduleTypes`, `daysAvailable`, `timeSlotsAvailable`, `locationTypes`, `experienceLevel`, `skills` to `ListingFilters` |
| `src/hooks/smartMatching/useSmartListingMatching.tsx` | 3 | Include worker filter fields in `filtersKey` cache key |
| `src/components/DashboardLayout.tsx` | 1 | In `handleApplyFilters`, extract `services_` prefixed keys and map to unprefixed worker filter names that the matching hook expects |
| `src/components/SavedSearches.tsx` | 4 | Add display badges for worker-specific filter_data fields (service_categories, skills, days_available) |

## No DB Changes Needed

All data structures are correct. The bugs are purely frontend key-mapping and type gaps.


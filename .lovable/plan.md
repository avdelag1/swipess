

# Remaining Filter & Matching Bugs

## Bug 1 — CRITICAL: `serviceCategory` and `experienceLevel` are arrays but SQL uses `.eq()` (single value)

`ListingFilters` types these as `string[]`, and `WorkerClientFilters` emits them as arrays. But `useSmartListingMatching` line 197 does `query.eq('service_category', effectiveFilters.serviceCategory)` — this silently fails for arrays. Same for `experienceLevel` at line 201.

**Fix:** Change `.eq()` to `.in()` for both fields when they are arrays.

## Bug 2 — HIGH: SwipessSwipeContainer filter change detection ignores worker filters

Lines 336-340 only check `categories`, `category`, `listingType`, `priceRange`. When a user applies worker-specific filters (service category, skills, work types), the deck doesn't reset — stale cards remain.

**Fix:** Add worker filter fields to the `filtersChanged` comparison.

## Bug 3 — HIGH: DashboardLayout prefix map is incomplete

`WorkerClientFilters.handleApply()` emits keys like `required_skills`, `experience_levels`, `required_certifications`, `time_slots_available`, `location_types`, `needs_emergency_service`, `needs_background_check`, `needs_insurance`, `price_min`/`price_max`. After AdvancedFilters prefixes them, they become `services_required_skills`, `services_experience_levels`, etc. The current `prefixMap` only maps 9 keys — at least 10 more are missing.

**Fix:** Expand the prefix map to cover all worker filter keys.

## Bug 4 — MEDIUM: Missing client-side JSONB filters in matching hook

`scheduleTypes`, `timeSlotsAvailable`, `locationTypes`, and `certifications` are defined in `ListingFilters` but never applied in the client-side filter section of `useSmartListingMatching`. Also missing: `offers_emergency_service`, `background_check_verified`, `insurance_verified` boolean checks.

**Fix:** Add `hasJsonOverlap` checks for schedule_type, time_slots_available, location_type, certifications, and boolean equality checks for verification fields.

---

## Files to Modify

| File | Bugs | Changes |
|------|------|---------|
| `src/hooks/smartMatching/useSmartListingMatching.tsx` | 1, 4 | Change `serviceCategory`/`experienceLevel` from `.eq()` to `.in()`. Add client-side filters for scheduleTypes, timeSlotsAvailable, locationTypes, certifications, and boolean verification fields. |
| `src/components/SwipessSwipeContainer.tsx` | 2 | Add worker filter fields to `filtersChanged` comparison (serviceCategory, workTypes, skills, daysAvailable, experienceLevel, scheduleTypes) |
| `src/components/DashboardLayout.tsx` | 3 | Expand `prefixMap` with missing worker keys: `services_required_skills`→`skills`, `services_experience_levels`→`experienceLevel`, `services_required_certifications`→`certifications`, `services_time_slots_available`→`timeSlotsAvailable`, `services_location_types`→`locationTypes`, `services_needs_emergency_service`→boolean, `services_needs_background_check`→boolean, `services_needs_insurance`→boolean, `services_price_min`/`services_price_max`→`priceRange` |

## No DB Changes


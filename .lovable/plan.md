

# Full Audit: Filter & Listing Connection Fixes

## Critical Findings

### Bug A — CRITICAL: `saved_filters` table column mismatch (2 files silently failing)

The `saved_filters` table has exactly these columns:
`id, user_id, filter_data, is_active, name, user_role, created_at, updated_at`

But both `useFilterPersistence.ts` and `useSavedFilters.ts` write to columns that **do not exist**:

**useFilterPersistence.ts (line 122-124):** writes `filters` (should be `filter_data`), and on insert (line 140-146) writes `category` and `mode` (don't exist).

**useSavedFilters.ts (lines 96-117, 128-155):** writes `category`, `mode`, `filters`, `listing_types`, `client_types`, `min_budget`, `max_budget`, `min_age`, `max_age`, `lifestyle_tags`, `preferred_occupations`, `allows_pets`, `allows_smoking`, `allows_parties`, `requires_employment_proof`, `requires_references`, `min_monthly_income` — **none exist as columns**.

**Result:** All filter save/load operations silently fail. No filters persist across sessions. The entire filter persistence system is broken.

**Fix:** Both files must store everything inside `filter_data` (the JSONB column) and `user_role` instead of nonexistent columns.

---

### Bug B — HIGH: Worker filters from WorkerClientFilters never reach the swipe deck

`WorkerClientFilters.handleApply()` saves to localStorage and calls `onApply(filters)`. The parent (`AdvancedFilters.tsx`) captures this in `handleApplyFilters` but only stores it in local component state (`categoryFilters`). When `handleApply` fires, it merges category filters and calls `onApplyFilters`.

However, `SwipessSwipeContainer` receives these as `ListingFilters` — but `useSmartListingMatching` does **not** check any worker-specific filter fields (service_category, work_type, schedule_type, days_available, experience_levels, skills, etc.) either at the SQL level or client-side. The worker filter fields are simply ignored during listing matching.

**Fix:** Add worker filter application in `useSmartListingMatching`:
- `service_category` filter → SQL `.in('service_category', [...])` when category is worker
- Client-side matching for `work_type`, `days_available`, `time_slots_available`, `skills`, `experience_level` (JSONB overlap checks)

---

### Bug C — MEDIUM: SWIPE_CARD_FIELDS missing worker fields for card display

`useSmartListingMatching.tsx` line 108 selects only: `id, title, price, images, image_url, city, neighborhood, beds, baths, square_footage, category, listing_type, property_type, vehicle_brand, vehicle_model, year, mileage, amenities, pet_friendly, furnished, owner_id, created_at`

Missing for worker cards: `description, service_category, pricing_unit, experience_years, experience_level, skills, days_available, time_slots_available, work_type, schedule_type, location_type, service_radius_km`

Without these, swipe cards for workers show no service category, no pricing unit, no experience, no skills.

**Fix:** Add worker fields to SWIPE_CARD_FIELDS.

---

### Bug D — MEDIUM: `useFilterPersistence` restore reads `(data as any).filters` but column is `filter_data`

Line 59 reads `const filters = (data as any).filters as Record<string, unknown> | null;` — but the DB column is `filter_data`, not `filters`. Restore always returns null.

**Fix:** Change to `data.filter_data`.

---

## Files to Modify

| File | Bug | Change |
|------|-----|--------|
| `src/hooks/useFilterPersistence.ts` | A, D | Use `filter_data` column; remove nonexistent `category`/`mode` columns on insert; read from `filter_data` on restore |
| `src/hooks/useSavedFilters.ts` | A | Pack all filter fields into `filter_data` JSONB; use `user_role` instead of `mode`; remove all nonexistent column references |
| `src/hooks/smartMatching/useSmartListingMatching.tsx` | B, C | Add worker fields to SWIPE_CARD_FIELDS; apply worker-specific filters (service_category at SQL level, work_type/days/skills at client-side) |

## No DB Changes Needed

The `saved_filters` table schema is correct. The code is writing to wrong column names.


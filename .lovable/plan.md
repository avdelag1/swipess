

# Plan: Fix Remaining Filter System Issues

## Issues Found

### 1. `(supabase as any)` casts still used for `owner_client_preferences` (BUG)
The `owner_client_preferences` table now exists in the auto-generated types, but both `useOwnerClientPreferences.ts` (lines 60, 87) and `useSmartClientMatching.tsx` (line 42) still use `(supabase as any)` to access it. This bypasses TypeScript type checking and masks potential errors.

**Fix:** Replace `(supabase as any)` with `supabase` in both files. The types are already in `types.ts`.

### 2. `OwnerClientPreferences` interface has ~25 phantom fields (SCHEMA MISMATCH)
The interface in `useOwnerClientPreferences.ts` defines fields like `compatible_lifestyle_tags`, `allows_pets`, `allows_smoking`, `requires_employment_proof`, `selected_languages`, `selected_relationship_status`, `smoking_habit`, `drinking_habit`, `cleanliness_level`, `noise_tolerance`, `work_schedule`, `selected_dietary_preferences`, `selected_personality_traits`, `selected_interests` — none of which exist in the DB table. The upsert silently ignores these fields, giving the false impression they're being saved.

**Fix:** Trim the `OwnerClientPreferences` interface to only include fields that exist in the database: `id`, `user_id`, `selected_genders`, `min_age`, `max_age`, `min_budget`, `max_budget`, `preferred_nationalities`, `created_at`, `updated_at`.

### 3. `ClientFilterPreferences` type has ~50 phantom fields (SCHEMA MISMATCH)
The type defines yacht fields (`yacht_types`, `yacht_length_min`, etc.), extended moto fields (`moto_engine_size_min`, `moto_cooling_system`, etc.), extended bicycle fields (`bicycle_wheel_sizes`, `bicycle_material`, etc.), extended vehicle fields (`vehicle_body_types`, `vehicle_drive_types`, etc.), and amenity booleans (`requires_gym`, `requires_balcony`, etc.) — none exist in the DB. The `update` and `insert` calls use `as any` casts which silently drop these fields.

**Fix:** Trim the `ClientFilterPreferences` type to match the actual `client_filter_preferences` DB columns. Remove the `[key: string]: any` escape hatch. Keep the `as any` casts for now since we're trimming to match.

### 4. EnhancedOwnerDashboard hydration overwrites user-active filters (BUG)
In `EnhancedOwnerDashboard.tsx` lines 40-53, the hydration effect runs on every `ownerPrefs` change and only checks `storeGender === 'any'` for gender. But for age/budget/nationality, it unconditionally overwrites whatever the user set via UI if DB has values. If a user sets age 20-30 via the filter page, then navigates back, and `ownerPrefs` arrives from the query, it will overwrite back to DB values.

**Fix:** Add a `hydrated` ref to run hydration only once, matching the pattern already used in `OwnerFilters.tsx`.

### 5. `useSmartListingMatching` uses `(supabase as any)` for listings query (MINOR)
Line 115 casts `supabase` to `any` for the listings query. The `listings` table is in the types. This should use typed `supabase`.

**Fix:** Remove the `(supabase as any)` cast.

## Changes

### File 1: `src/hooks/useOwnerClientPreferences.ts`
- Trim `OwnerClientPreferences` interface to only DB-existing fields
- Remove `(supabase as any)` casts, use typed `supabase`

### File 2: `src/hooks/useClientFilterPreferences.ts`
- Trim `ClientFilterPreferences` type to only DB-existing fields
- Remove the `[key: string]: any` escape hatch
- Keep the `as any` casts on insert/update since we're now schema-aligned

### File 3: `src/hooks/smartMatching/useSmartClientMatching.tsx`
- Remove `(supabase as any)` cast for `owner_client_preferences` query (line 42)

### File 4: `src/hooks/smartMatching/useSmartListingMatching.tsx`
- Remove `(supabase as any)` cast for listings query (line 115)

### File 5: `src/components/EnhancedOwnerDashboard.tsx`
- Add a `hydratedRef` to prevent re-hydrating from DB after user actively changes filters

## What This Fixes
- TypeScript will now catch column name typos and missing fields at compile time
- No more phantom fields that appear to save but silently get dropped
- Owner dashboard won't overwrite user-active filter selections with stale DB values
- Both preference hooks are schema-aligned and type-safe


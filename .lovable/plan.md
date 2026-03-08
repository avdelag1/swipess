

# Plan: Add Age Range, Budget Range, and Nationality to Owner Filters

## Problem
The `owner_client_preferences` table **does not exist** in the database. The hook uses `(supabase as any)` and silently fails on every read/write. The OwnerFilters page currently only has Gender and Client Type sections with no age, budget, or nationality controls.

## Changes

### 1. Database Migration — Create `owner_client_preferences` table
Create the table with columns for all current and new filter fields:
- `id` (uuid, PK), `user_id` (uuid, unique, not null)
- `selected_genders` (jsonb, default `[]`)
- `min_age`, `max_age` (integer, nullable)
- `min_budget`, `max_budget` (numeric, nullable)
- `preferred_nationalities` (jsonb, default `[]`)
- `created_at`, `updated_at` (timestamptz)
- RLS: users can SELECT/INSERT/UPDATE their own rows only

### 2. `src/pages/OwnerFilters.tsx` — Add 3 new filter sections
- **Age Range**: Dual-thumb slider (18–65+), shows selected range, hydrates from DB
- **Budget Range**: Dual-thumb slider ($0–$50,000), hydrates from DB
- **Nationality**: Scrollable list of common nationalities with multi-select chips (Mexican, American, Canadian, Colombian, Brazilian, European, Asian, Other)
- Update `activeFilterCount` to include new filters
- Update `handleApply` to persist all new fields to `owner_client_preferences`
- Update `handleReset` to clear new fields
- Update hydration `useEffect` to restore age/budget/nationality from DB

### 3. `src/state/filterStore.ts` — Add owner filter fields
- Add `clientAgeRange`, `clientBudgetRange`, `clientNationalities` to state
- Add setter actions and include in `resetOwnerFilters`
- Include in `getActiveFilterCount` for owner role

### 4. `src/hooks/smartMatching/useSmartClientMatching.tsx` — Apply new filters
- Read `min_age`, `max_age`, `min_budget`, `max_budget`, `preferred_nationalities` from DB as fallbacks
- Apply age range filter on `profile.age`
- Apply nationality filter on `profile.nationality`
- Budget range already partially supported via `filters.budgetRange`

### 5. `src/hooks/useOwnerClientPreferences.ts` — Minor cleanup
- Remove `(supabase as any)` cast once table exists and types regenerate (types auto-update after migration)

## Visual Design
New sections follow the existing pattern: section label badge with colored dot, then interactive controls. Age and Budget use the existing `Slider` component styled to match. Nationality uses horizontally-wrapping pill chips similar to the gender cards but smaller.


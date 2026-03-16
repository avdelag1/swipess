

## Plan: Add Roommate Preferences Filter + Smart Matching

### Problem
The roommate matching page has no preference controls. Users can't specify what kind of roommate they want (gender, budget, lifestyle habits). The `roommate_preferences` table already exists in the DB with fields for `preferred_gender`, `preferred_budget_min/max`, `preferred_neighborhoods`, and `deal_breakers`, but nothing in the UI writes to it or reads from it for filtering.

### Changes

#### 1. Create `RoommateFiltersSheet.tsx` — Bottom sheet filter panel

A glassmorphic bottom sheet (matching the style of `NewClientFilters.tsx`) with these sections:

- **Gender Preference** — Pill toggles: Any, Male, Female, Non-Binary (saves to `roommate_preferences.preferred_gender` JSONB array)
- **Budget Range** — Dual slider for min/max monthly budget (saves to `preferred_budget_min/max`)
- **Age Range** — Dual slider for preferred age range (new columns: `preferred_age_min`, `preferred_age_max`)
- **Lifestyle Match** — Pill toggles for cleanliness level, noise tolerance, smoking/drinking habits, work schedule (new column: `lifestyle_preferences` JSONB)
- **Deal Breakers** — Multi-select pills: Smoking, Pets, Late-night noise, etc. (saves to `deal_breakers` JSONB)

Sticky "Apply" button with active filter count badge.

#### 2. Database Migration — Add missing columns to `roommate_preferences`

```sql
ALTER TABLE public.roommate_preferences
ADD COLUMN IF NOT EXISTS preferred_age_min integer,
ADD COLUMN IF NOT EXISTS preferred_age_max integer,
ADD COLUMN IF NOT EXISTS preferred_cleanliness text,
ADD COLUMN IF NOT EXISTS preferred_noise_tolerance text,
ADD COLUMN IF NOT EXISTS preferred_smoking text,
ADD COLUMN IF NOT EXISTS preferred_drinking text,
ADD COLUMN IF NOT EXISTS preferred_work_schedule text;
```

#### 3. Update `RoommateMatching.tsx` — Add filter button + apply preferences

- Add a `Filter` icon button in the header (next to the Visible toggle) that opens the `RoommateFiltersSheet`
- Fetch the user's `roommate_preferences` on load
- Apply preferences as filters when building the candidate list:
  - Filter by gender if not "any"
  - Filter by age range if set
  - Boost compatibility score for matching lifestyle preferences (cleanliness, noise, smoking, work schedule)
  - Exclude candidates matching deal breakers
- Update `calculateCompatibility()` to weight matches against saved preferences higher

### Files

| File | Action |
|------|--------|
| Database migration | Add columns to `roommate_preferences` |
| `src/components/filters/RoommateFiltersSheet.tsx` | Create — bottom sheet with gender, budget, age, lifestyle, deal breaker filters |
| `src/pages/RoommateMatching.tsx` | Edit — add filter button, load preferences, apply filters to candidate query and scoring |


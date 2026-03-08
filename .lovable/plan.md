

# Fix 5 Confirmed Filter Bugs — Silent Failures Throughout Matching Pipeline

I verified every bug reported. They are all **real and present in the current code**. I should have caught these earlier — I apologize. Here is exactly what is broken and how each fix works.

---

## Bug 1 — CRITICAL: Price field name mismatch in `matchCalculators.ts`

**Problem:** `calculateListingMatch()` reads `preferences.min_price` / `preferences.max_price` (line 30), but the DB columns and the `ClientFilterPreferences` type use `price_min` / `price_max`. Additionally, `PropertyClientFilters.tsx` saves as `min_price`/`max_price` which are not real DB columns — so price preferences may not even persist correctly.

**Result:** Price budget matching is always skipped. Every listing scores as if no budget was set.

**Fix in `matchCalculators.ts`:** Read both field name variants:
```typescript
const priceMin = preferences.price_min ?? (preferences as any).min_price;
const priceMax = preferences.price_max ?? (preferences as any).max_price;
```

**Fix in `PropertyClientFilters.tsx`:** Change `min_price`/`max_price` to `price_min`/`price_max` in the save call so values actually persist to DB.

---

## Bug 2 — CRITICAL: Missing SELECT fields cause budget/pet/party filters to silently skip

**Problem:** `CLIENT_SWIPE_CARD_FIELDS` in `useSmartClientMatching.tsx` (line 120) doesn't select `budget_max`, `has_pets`, `party_friendly`, or `relationship_status`. The filter logic (lines 208-260) checks these fields but they're always `undefined`.

**Reality check:** The `profiles` table doesn't have `budget_max`, `has_pets`, or `party_friendly` columns either. But `client_profiles` does have `relationship_status`, `has_children`. The enrichment map (line 166-198) already pulls from `client_profiles` but doesn't map `relationship_status` or `has_children`.

**Fix:** Add `relationship_status` from `client_profiles` enrichment. For `budget_max`/`has_pets`/`party_friendly` — these fields don't exist in either table, so the filter checks should be guarded to not silently pass (they currently skip correctly when `undefined`, so this is lower priority but we should note it for future schema additions).

---

## Bug 3 — HIGH: Language filter field name mismatch

**Problem:** Line 269 checks `profile.languages` but the enriched profile uses `profile.languages_spoken`.

**Result:** Language filter never matches anything.

**Fix:** Change `profile.languages` to `profile.languages_spoken` on lines 269-270.

---

## Bug 4 — HIGH: `calculateClientMatch` is never called for owner-side scoring

**Problem:** `calculateClientMatch()` exists in `matchCalculators.ts` with a full weighted algorithm (budget 20%, smoking 15%, lifestyle 15%, pets 12%, etc.), but `useSmartClientMatching.tsx` ignores it and uses a trivial base score (50 + profile completeness). Owner preferences are fetched with only 6 fields via `.select(...)` instead of `*`.

**Result:** Match percentages are meaningless — they only reflect profile completeness, not actual compatibility with owner preferences.

**Fix:**
- Change `.select('selected_genders, min_age, ...')` to `.select('*')` for owner prefs
- Import and call `calculateClientMatch()` for scoring, with the simple base score as fallback when no owner preferences exist
- Build enriched client profiles from the merged profiles + client_profiles data

---

## Bug 5 — MEDIUM: OwnerClientFilterDialog discards listing type and client type selections

**Problem:** `handleSave()` in `OwnerClientFilterDialog.tsx` (line 251) only saves `selected_genders`, `min_budget`, `max_budget`, `min_age`, `max_age`. The `selectedInterestTypes`, `selectedListingTypes`, and `selectedClientTypes` states are collected from UI but never persisted or dispatched.

**Result:** Owner selects interest/listing/client types, clicks save, selections are lost.

**Fix:** Include `selectedInterestTypes` and `selectedClientTypes` in the saved preferences object, and dispatch to filterStore for immediate real-time effect.

---

## Files to Modify

| File | Bugs | Changes |
|------|------|---------|
| `src/hooks/smartMatching/matchCalculators.ts` | 1 | Read `price_min`/`price_max` with `min_price`/`max_price` fallback |
| `src/hooks/smartMatching/useSmartClientMatching.tsx` | 2, 3, 4 | Fix language field name, add enrichment for relationship_status, use `calculateClientMatch()`, expand owner prefs SELECT to `*` |
| `src/components/filters/PropertyClientFilters.tsx` | 1 | Save `price_min`/`price_max` instead of `min_price`/`max_price` |
| `src/components/OwnerClientFilterDialog.tsx` | 5 | Include interest/client type selections in save |




## Plan: Fix Listing Creation, Category-Specific Mode Icons, Add Scuba Diving

### 1. Fix Listing Creation Error — `location` column

The error "Could not find the 'location' column of 'listings' in the schema cache" occurs when submitting the form. The column exists in the database, so this is a PostgREST schema cache issue. The fix:

**`src/components/UnifiedListingForm.tsx`** (line 177):
- The `location` field is set to `formData.city || formData.address || 'Unknown'`. For motorcycle/bicycle/worker categories, the user may not fill city/address fields, resulting in `'Unknown'` which should still work. 
- However, the real issue is likely that the Supabase client has **stale hardcoded fallback credentials** in `client.ts` pointing to project `vplgtcguxujxwrgguxqq` while the Cloud project is `qegyisokrxdsszzswsqk`. If env vars fail to load, the app connects to the wrong project.
- **Fix**: Make the listing payload more defensive — ensure `location` always has a valid string, and strip any `undefined` values from the payload before insert. Also add better error messaging.

Changes in `UnifiedListingForm.tsx`:
- Ensure `location` defaults to a non-empty string based on category context
- Clean the payload object to remove any `undefined` values before sending to the database
- This prevents PostgREST from choking on schema mismatches

### 2. Redesign Mode Selection Icons — Category-Specific

**`src/components/CategorySelectionDialog.tsx`**:

Currently the mode step always shows: 🏠 For Rent, 💰 For Sale, ✨ Both Options — regardless of category.

Change to dynamic icons based on selected category:
- **Property**: 🏠 Rent, 💰 Sale, ✨ Both
- **Motorcycle**: 🏍️ Rent, 💰 Sale, ✨ Both  
- **Bicycle**: 🚲 Rent, 💰 Sale, ✨ Both

Also replace the category selection icons with cleaner Lucide icons:
- Property: `Building2` (cleaner than `Home`)
- Motorcycle: `Bike` icon or keep `CircleDot` but use a motorcycle-relevant one
- Bicycle: Keep `Bike`
- Jobs: Keep `Briefcase`

Make mode descriptions category-aware too:
- "Monthly or short-term motorcycle rental" vs "Monthly or short-term property rental"

### 3. Add Scuba Diving Profession to Service Categories

**`src/data/serviceCategories.ts`**:

Add new entry under a new group "Water & Adventure" (or under "Personal Care & Wellness"):

```
{ value: 'scuba_instructor', label: 'Scuba Diving Instructor / Divemaster', icon: '🤿', group: 'Water & Adventure' }
```

Add the new group `'Water & Adventure'` to `SERVICE_GROUPS`.

Add subspecialties with all certification/skill levels:
```typescript
scuba_instructor: [
  'Discover Scuba (Intro)',
  'Open Water Diver (OWD)',
  'Advanced Open Water (AOWD)',
  'Rescue Diver',
  'Master Scuba Diver',
  'Divemaster (DM)',
  'Assistant Instructor (AI)',
  'Open Water Scuba Instructor (OWSI)',
  'Deep Diving Specialty',
  'Night Diving',
  'Nitrox / Enriched Air',
  'Wreck Diving',
  'Cave Diving',
  'Cavern Diving',
  'Technical Diving (Tec)',
  'Underwater Photography',
  'Search & Recovery',
  'Drift Diving',
  'Boat Diving',
  'Emergency First Response (EFR)',
]
```

### Files to Edit (3 files)

| File | Change |
|------|--------|
| `UnifiedListingForm.tsx` | Defensive `location` handling, strip undefined values from payload |
| `CategorySelectionDialog.tsx` | Dynamic category-specific mode icons/emojis and descriptions |
| `serviceCategories.ts` | Add scuba diving profession with full certification subspecialties |


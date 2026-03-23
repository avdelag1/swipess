# Add a New Marketplace Vertical

## Overview
The app supports multiple listing categories (property, motorcycle, bicycle, services). This directive covers adding a new vertical (e.g., "boats", "parking", "storage").

## Files to Update

### 1. Types — `src/types/filters.ts`
Add the new category ID to the `QuickFilterCategory` type:

```typescript
export type QuickFilterCategory =
  | 'property'
  | 'motorcycle'
  | 'bicycle'
  | 'services'
  | 'boats';  // ← add here
```

### 2. Category Config — `src/components/SwipessSwipeContainer.tsx`
Add to the `categoryConfig` object (lines ~48-55):

```typescript
const categoryConfig = {
  // ... existing categories ...
  boats: { icon: AnchorIcon, label: 'Boat', plural: 'Boats', color: 'text-blue-500' },
};
```

### 3. Quick Filter Bar — `src/components/CategorySwipeStack.tsx`
Add to the `CATEGORIES` array (lines ~11-17):

```typescript
const CATEGORIES = [
  // ... existing ...
  { id: 'boats', label: 'Boats', icon: AnchorIcon, color: 'from-blue-500 to-blue-400', description: 'Explore the water', image: '<unsplash_url>' },
];
```

Also add to `QuickFilterBar.tsx` and `AdvancedFilters.tsx` if they have category lists.

### 4. Database — Supabase Migration
If the vertical uses a different schema (e.g., boats have "length" and "engine_type" instead of "beds" and "baths"):

```sql
-- supabase/migrations/TIMESTAMP_add_boats_vertical.sql
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS boat_length_ft numeric,
  ADD COLUMN IF NOT EXISTS engine_type text,
  ADD COLUMN IF NOT EXISTS marina_location text;
```

If the vertical fits the existing `listings` schema (just a new `category` value), no migration is needed.

### 5. Smart Matching — `src/hooks/smartMatching/useSmartListingMatching.tsx`
Add the new category to any category-based scoring or filter logic. Search for existing category names to find all switch/if blocks.

### 6. Empty State Icons
Add the new icon to wherever the empty swipe state renders. Search for `categoryConfig` usage to find all render sites.

### 7. Filters — `src/components/AdvancedFilters.tsx`
Add any vertical-specific filter controls (e.g., boat length range, marina city).

## Checklist

- [ ] Type added to `QuickFilterCategory`
- [ ] Icon imported and added to `categoryConfig`
- [ ] Category added to `CategorySwipeStack` CATEGORIES array
- [ ] Category added to `QuickFilterBar` if applicable
- [ ] Migration created if schema extension needed
- [ ] Smart matching scoring updated if vertical has unique attributes
- [ ] Advanced filters updated with vertical-specific controls
- [ ] Empty state tested (swipe through all cards for new vertical)
- [ ] Test that filtering by new vertical works end-to-end

## Naming Conventions

- Database `category` column value: lowercase, no spaces (e.g., `boats`)
- UI label: Title case (e.g., `Boats`)
- Type value: same as DB value (e.g., `'boats'`)
- Plural label for empty states: add `s` or define explicitly

## Notes
- The `listings.category` column uses a free-text string, not an enum, so no migration is needed just to add a new category value
- The DB trigger `tr_handle_mutual_like` works for all verticals — no changes needed
- RLS policies cover all listings regardless of category — no changes needed

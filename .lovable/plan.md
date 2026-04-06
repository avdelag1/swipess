

# Fix Liked Pages Scrolling + Add Filters + Fix Dashboard Layout Compression

## Problems Identified

1. **Liked pages steal touch gestures**: Both client and owner Liked pages use `PremiumSortableGrid` with long-press drag-and-drop reordering. This interferes with normal scrolling — the gesture gating (400ms hold) still creates friction and confusion on mobile.

2. **No useful filters on Liked pages**: The existing category tabs are basic. There's no price range filter, no text search by description/keywords (e.g. searching "cleaning lady"), and no pipeline-style filtering to narrow down saved items.

3. **Dashboard swipe area is compressed**: The `DistanceSlider` + "SEARCHING PROPERTY IN 50KM" label + action buttons are all stacked at the top with `absolute` positioning and overlapping z-indices, making the swipe card area feel shrunk and cramped (visible in the screenshot).

---

## Plan

### 1. Remove Drag-and-Drop from Both Liked Pages

**Files**: `src/pages/ClientLikedProperties.tsx`, `src/components/LikedClients.tsx`

- Replace `PremiumSortableGrid` with a simple `motion.div` grid (no drag, no reorder)
- Remove `usePersistentReorder` hook usage
- Remove `GripVertical` icon and "Drag to reorder" hint
- Remove `PremiumSortableGrid` import
- Keep the existing `PremiumLikedCard` rendering — just in a plain scrollable grid
- Ensure the container scrolls naturally with `overflow-y-auto` / normal flow

### 2. Add Smart Filter Pipeline to Client Liked Page

**File**: `src/pages/ClientLikedProperties.tsx`

Add filter controls below the category tabs:

- **Price range filter**: Min/Max price inputs or a dual-thumb slider, filtering by `property.price`
- **Search by title + description**: Expand the existing search to also match against `property.description`, so searching "cleaning" or "limpieza" finds relevant workers/services
- **Sort options**: Dropdown to sort by Date Liked (newest/oldest), Price (low/high), Title (A-Z)
- Keep existing category tabs (Properties, Motorcycles, Bicycles, Workers)

The filter pipeline: Category → Search text (title + description + location) → Price range → Sort

### 3. Add Smart Filter Pipeline to Owner Liked Page  

**File**: `src/components/LikedClients.tsx`

Add filter controls:

- **Search by name + occupation + bio**: Already partially exists, enhance to search across all text fields
- **Sort options**: Date liked (newest/oldest), Name (A-Z)
- Keep existing category tabs (Renters, Workers, Buyers) and Safe filter toggle

### 4. Fix Dashboard Layout Compression

**File**: `src/components/SwipessSwipeContainer.tsx`

The issue: The `DistanceSlider` overlay (lines 961-982) uses `absolute top-0` positioning with `pt-8 pb-8` padding, creating a tall overlay that pushes into the card area. Combined with the "SEARCHING PROPERTY" badge (also absolute, at `top-[calc(var(--top-bar-height)+24px)]`), and the action buttons at the bottom, the actual card area gets squeezed.

Fix:
- Move the `DistanceSlider` from the absolute overlay into a proper flow-based position above the card area (not overlapping)
- Give the "SEARCHING X IN Ykm" badge proper spacing so it doesn't overlap the slider
- Ensure the card area gets `flex-1` to fill remaining space naturally instead of being squeezed by absolute overlays
- Adjust the card container from `absolute inset-0` to a flex child that respects the controls above it

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/ClientLikedProperties.tsx` | Remove drag-and-drop, add price filter + description search + sort |
| `src/components/LikedClients.tsx` | Remove drag-and-drop, add enhanced search + sort |
| `src/components/SwipessSwipeContainer.tsx` | Fix layout — move controls out of absolute overlays into normal flow |




## Fix Quick Filter to Show Listing Categories (Both Sides)

### What's Wrong Now

The **owner-side quick filter** dropdown currently shows "Gender" and "Looking For" (Hiring/Renting/Buying) options. The user wants it to show **listing categories** instead (Property, Motos, Bikes, Workers) -- the same categories as the client side. When you select a category, the dashboard should refresh to show only clients interested in that category, and the top bar title should update to reflect the active filter.

The **client side** already works correctly with category-based quick filters.

### What Will Change

1. **Owner Quick Filter Dropdown** (`QuickFilterDropdown.tsx`) -- Replace the Gender + Client Type sections with the same category selection UI used for clients (Property, Motorcycle, Bicycle, Workers). Remove gender/clientType filter options from the owner dropdown.

2. **Owner Quick Filter Bar** (`QuickFilterBar.tsx`) -- Same change: replace Gender + Client Type chips with category chips matching the client side.

3. **Top Bar Title** (`DashboardLayout.tsx`) -- Update the owner dashboard title logic to use `activeCategory` (same as client side) instead of `clientType`. When a category is selected, it shows "Properties", "Motorcycles", etc. When no filter is active, it shows "Your Matches".

4. **Dashboard Refresh** -- The `ClientSwipeContainer` already watches for filter changes and resets the deck. When the quick filter updates `activeCategory` in the Zustand store, the container will detect the change and refetch client profiles filtered by that category. The `useSmartClientMatching` hook already accepts a `category` parameter -- we just need to wire the store's `activeCategory` into it.

### Technical Details

**File: `src/components/QuickFilterDropdown.tsx`**
- In `renderOwnerFilters()`: Replace the Gender and Client Type sections with the same category list used in `renderClientFilters()`. When the user selects a category (Property, Moto, Bicycle, Workers), it calls `setCategories([categoryId])` and `setActiveCategory(categoryId)` on the store.
- The listing type sub-options (Rent/Buy/Both) remain available per category, same as client side.

**File: `src/components/QuickFilterBar.tsx`**
- In the owner section (lines 218-265): Replace Gender + Client Type dropdowns with category chip buttons matching the client layout.

**File: `src/components/DashboardLayout.tsx`**
- Update owner dashboard title (around line 512-520): Use `activeCategory` to determine the title instead of `clientType`. Map categories to labels: property -> "Properties", motorcycle -> "Motorcycles", bicycle -> "Bicycles", services -> "Workers". Default to "Your Matches" when no category is active.

**File: `src/pages/OwnerDashboardNew.tsx`**
- Pass the store's `activeCategory` as the `category` prop to `ClientSwipeContainer` so the swipe deck refreshes when the filter changes.

**File: `src/components/ClientSwipeContainer.tsx`**
- Ensure the `category` prop is wired into `useSmartClientMatching` so that switching categories triggers a data refetch with the correct filter.

### Flow

When an owner taps "Quick Filter" and selects "Motos":
1. Store updates: `activeCategory = 'motorcycle'`, `categories = ['motorcycle']`
2. Top bar title changes from "Your Matches" to "Motorcycles"
3. `ClientSwipeContainer` detects filter change, resets deck
4. `useSmartClientMatching` refetches with `category='moto'`
5. New client profiles (moto seekers) appear in the swipe deck

### Files Modified
1. `src/components/QuickFilterDropdown.tsx` -- Owner filter uses categories instead of gender/clientType
2. `src/components/QuickFilterBar.tsx` -- Owner bar uses category chips
3. `src/components/DashboardLayout.tsx` -- Owner title uses activeCategory
4. `src/pages/OwnerDashboardNew.tsx` -- Pass activeCategory to ClientSwipeContainer

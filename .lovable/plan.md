

## Fix Page Layouts: Remove Bordered Frames, Fix Overlaps, Resize Radio

### Problems Identified
From the screenshots, there are several issues across multiple pages:

1. **White bordered frames** on filter and settings pages (the `GlassSurface` component adds visible borders around every section)
2. **Buttons/content hidden behind bottom navigation** on filter pages and radio page
3. **Radio page is too large** - vinyl record, click wheel, volume slider, and city pills overflow and mix with the bottom navigation
4. **Radio iPod design is oversized** - the click wheel and vinyl need to be significantly smaller to fit on mobile screens within the available space (between top bar and bottom nav)

### Changes

#### 1. Owner Filters Page (`src/pages/OwnerFilters.tsx`)
- Remove `GlassSurface` wrappers and replace with simple unstyled containers (no borders, no glass effect)
- Change the layout from `fixed inset-0 z-50` to a normal flow layout that respects the `DashboardLayout` padding (top bar + bottom nav)
- Move the Apply button up so it does not collide with the bottom navigation (use `pb-28` spacer instead of relying on safe area)

#### 2. Client Filters Page (`src/pages/ClientFilters.tsx`)
- Same treatment: remove `GlassSurface` wrappers, remove bordered frames
- Change layout from `fixed inset-0 z-50` to normal flow within `DashboardLayout`
- Ensure Apply button and category list do not overlap with bottom navigation

#### 3. Client Settings Page (`src/pages/ClientSettingsNew.tsx`)
- Remove `GlassSurface` wrapper around the settings menu list
- Keep the clean list style but without the visible bordered card frame

#### 4. Radio Page (`src/pages/RetroRadioStation.tsx`)
- Significantly reduce the vinyl disc and click wheel sizes (reduce by ~30-40% on mobile)
- Remove the `fixed inset-0` layout and make it work within the `DashboardLayout` content area so it respects top bar and bottom nav spacing
- Reduce padding and spacing between sections so everything fits in the viewport
- Make city pills a single horizontal scroll row instead of wrapping (to save vertical space)

### Technical Details

**Filter pages layout change:**
- Remove `fixed inset-0 z-50` wrapper -- instead use `min-h-full` within the DashboardLayout scroll container
- Replace `<GlassSurface elevation="elevated" className="p-4">` with plain `<div className="space-y-2">` or similar borderless containers
- Move the sticky Apply button to use `fixed bottom-20` (above the ~60px bottom nav) instead of using safe area insets

**Radio page sizing:**
- Reduce `getVinylSize()` returns: mobile values from 120-140px down to 80-100px
- Reduce `getWheelSize()` returns: mobile values from 100-110px down to 70-85px
- Remove `fixed inset-0` and use a normal page layout that flows within DashboardLayout
- Tighten all vertical padding (`py-2` to `py-1`, remove spacers)

**Settings page:**
- Replace `<GlassSurface elevation="elevated">` with a simple `<div className="rounded-xl overflow-hidden bg-card/30">` or remove the wrapper entirely

### Files to Modify
1. `src/pages/OwnerFilters.tsx` - Remove glass frames, fix layout
2. `src/pages/ClientFilters.tsx` - Remove glass frames, fix layout  
3. `src/pages/ClientSettingsNew.tsx` - Remove glass frame around menu
4. `src/pages/RetroRadioStation.tsx` - Shrink vinyl/wheel, fix layout to not overlap bottom nav
5. `src/pages/OwnerSettingsNew.tsx` (if exists with same pattern) - Remove glass frames


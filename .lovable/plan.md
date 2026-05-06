## Goal
Eliminate the gray-on-white / white-on-white blobs in the New Listing wizard, Owner Filters, and Client Filters. Every chip, checkbox, and footer button must have a clear inactive surface and a bold active state in both themes.

## Changes

### 1. ChipMultiSelect (Vibe / Amenities / Included / Rules)
File: `src/components/listing/ChipMultiSelect.tsx`
- Inactive chip: `bg-secondary text-foreground border-border` (was `bg-white/[0.04] text-muted-foreground`).
- Active chip: `bg-primary text-primary-foreground border-primary shadow-md` (drop accent-tinted faint fill).

### 2. CategorySelector (Properties / Motorcycles / Bicycles / Workers + Rent/Sale)
File: `src/components/CategorySelector.tsx`
- Inactive category and mode buttons: `bg-secondary text-foreground border-border`.
- Keep gradient active styles, ensure text is white.

### 3. Property/Motorcycle/Bicycle/Worker listing forms — sections + checkbox rows
Files: `src/components/PropertyListingForm.tsx`, `MotorcycleListingForm.tsx`, `BicycleListingForm.tsx`, `WorkerListingForm.tsx`
- `Section` wrapper: `bg-card border border-border shadow-md` (was `bg-muted/30`).
- `CheckboxRow`: `bg-secondary border border-border` with a visible Checkbox border so the empty state shows.

### 4. UnifiedListingForm footer + cards
File: `src/components/UnifiedListingForm.tsx`
- Publish/Next button: solid `bg-primary text-primary-foreground` with rose shadow; ensure label color is white at all times.
- Cancel: add `border border-border` and `text-foreground`.
- Loop Video and Legal cards: confirmed `bg-card border-border` so they read on the off-white page.

### 5. OwnerFilters circular pills (price / bedrooms / bathrooms)
File: `src/pages/OwnerFilters.tsx` (line ~81)
- Inactive: `bg-card border border-border text-foreground`.
- Active: `bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20`.

### 6. ClientFilters quick buttons
File: `src/pages/ClientFilters.tsx` (lines ~98, 136, 199)
- Same active/inactive pattern as OwnerFilters.

### 7. PropertyClientFilters (light-mode polish)
File: `src/components/filters/PropertyClientFilters.tsx`
- Light inactive: `bg-secondary border-border text-foreground` (was `bg-black/5`).
- Active stays `bg-primary text-primary-foreground border-primary`.

## Out of Scope
- Layout, routing, swipe physics, dark-theme palette overhaul.

## Acceptance
- Light theme: every chip/button in New Listing, Owner Filters, Client Filters has readable text and a distinct inactive surface.
- Furnished / Pet Friendly checkboxes show a visible empty box.
- Wizard Publish/Next button is solid rose with white text.
- Dark theme remains unchanged visually.

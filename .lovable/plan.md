

# Premium Listing Creation Forms — Design Overhaul

## Vision

The current listing forms (Property, Motorcycle, Bicycle, Worker) use plain `<Card>` components with basic `<Input>`, `<Label>`, `<Select>`, and `<Checkbox>` elements. They look functional but generic — "Tailwind starter kit" energy. The goal is to transform them into a premium, alive, cinematic experience that matches the rest of SwipesS's luxury design language.

This covers:
1. **CategorySelectionDialog** — the entry point where owners pick what to list
2. **UnifiedListingForm** — the wrapper with photos, video, submit
3. **PropertyListingForm**, **MotorcycleListingForm**, **BicycleListingForm**, **WorkerListingForm** — each category's detail fields
4. **CategorySelector** — the inline category/mode pill tabs inside the form

---

## What Changes

### 1. Category Selection Dialog (`CategorySelectionDialog.tsx`)

**Current**: Flat bordered cards with small icons, basic gradient tints.

**Upgrade**:
- Category cards: Larger icon containers (56px), deeper gradient overlays using the established category color system (Property=Emerald, Moto=Orange, Bicycle=Purple, Worker=Amber), glassmorphic card surfaces with `bg-white/5 backdrop-blur-xl border border-white/10`
- Add subtle `motion.button` with spring whileTap (scale 0.96) and whileHover (scale 1.02, y: -2)
- Mode selection cards: Same glass treatment, larger emoji (40px), stronger hover glow
- AI button: Add a subtle animated gradient shimmer overlay

### 2. UnifiedListingForm — Photo & Submit Sections (`UnifiedListingForm.tsx`)

**Current**: Dark cards with basic upload grid, plain submit bar.

**Upgrade**:
- Photo upload button: Larger dashed border area with pulsing icon on empty state, category-colored accent glow
- Submit bar: Stronger glass backdrop, larger publish button with elastic spring tap, gradient accent matching selected category
- Section headers inside the form: Add subtle category-colored left accent bars

### 3. All Four Category Forms — Shared Design System

**Current problem**: All four forms use raw `<Card>` with `<CardHeader><CardTitle>` and `<CardContent>`. The cards look identical to every other card in the app — no premium listing-creation feel. Inputs are small, labels are plain, checkboxes are tiny.

**Upgrade — apply consistently to all 4 forms**:

- **Section Cards**: Replace plain `<Card>` with styled containers — `rounded-3xl bg-zinc-900/30 backdrop-blur-sm border border-white/5 shadow-xl` (matches the photo card style already in UnifiedListingForm)
- **Section Titles**: Bolder, with a small colored dot/icon accent before the text. Size bump from default `text-2xl` to `text-base font-bold` with `text-foreground` (the Card component defaults to `text-2xl` which is too large for form section headers)
- **Labels**: Add `text-sm font-semibold text-foreground/80 mb-1.5` for stronger hierarchy
- **Inputs**: Already have glass styling from `input.tsx` — keep as-is
- **Select triggers**: Already have glass styling — keep as-is  
- **Checkboxes**: Increase from `h-4 w-4` to `h-5 w-5`, add rounded-lg for softer feel
- **Checkbox rows**: Add `p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors` wrapper for each checkbox row — makes them feel like tappable areas instead of tiny targets
- **Grid layouts**: Ensure consistent `gap-4` spacing, responsive `grid-cols-1 sm:grid-cols-2`

### 4. CategorySelector — Inline Pills (`CategorySelector.tsx`)

**Current**: Basic pill buttons with `bg-card/60` inactive state.

**Upgrade**:
- Active pill: Category-specific gradient background (not just `bg-primary`). Property=emerald gradient, Moto=orange, Bicycle=purple, Worker=amber
- Inactive pills: `bg-white/5 border-white/10` glass surface
- Add `motion.button` with spring tap animation
- Icons: Slightly larger (w-5 h-5)

### 5. WorkerListingForm-specific Enhancements

**Current**: `PillToggle` and `TagInput` components are functional but plain.

**Upgrade**:
- **PillToggle**: Active pills get category amber glow (`shadow-amber-500/20`), inactive pills get glass surface
- **TagInput badges**: `bg-amber-500/15 text-amber-300 border-amber-500/20` for worker theme
- **Day selector buttons**: Increase from `w-11 h-11` to `w-12 h-12`, add glass surface styling

---

## Files Modified

1. `src/components/CategorySelectionDialog.tsx` — Glass cards, spring animations, AI button shimmer
2. `src/components/UnifiedListingForm.tsx` — Photo section polish, submit bar upgrade, section accents
3. `src/components/CategorySelector.tsx` — Category-colored active pills, glass inactive, motion
4. `src/components/PropertyListingForm.tsx` — Premium card wrappers, checkbox tap areas, label hierarchy
5. `src/components/MotorcycleListingForm.tsx` — Same treatment as Property
6. `src/components/BicycleListingForm.tsx` — Same treatment as Property
7. `src/components/WorkerListingForm.tsx` — Same + themed PillToggle/TagInput/DaySelector

No logic changes. No routing changes. No database changes. Pure visual refinement.


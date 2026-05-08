## Goal

Three connected fixes for owner listings:

1. **Edit listing prefills with existing data** (currently fields go blank).
2. **Replace freeform text inputs with chip-builder selectors** that compose the description automatically — no description textarea anywhere (listings, profiles, roommate).
3. **Clean up the listing Preview / Insights screen** — remove the giant translucent circles overlaying the photo, fix the cut-off X button, polish the stats.

---

## 1. Edit listing prefill bug

**Root cause** — `PropertyListingForm` runs `propertyFormSchema.safeParse(initialData)` on the listing fetched from DB. The schema declares `house_rules: z.array(z.string())`, but the DB stores `house_rules` as a joined string (`'No smoking · Quiet hours'`). `safeParse` fails, so `safeInitialData = {}` → every field renders empty.

**Fix**
- In `PropertyListingForm`, normalize `initialData` before parsing:
  - Convert `house_rules` from string → array (split on ` · `).
  - Coerce numeric fields that may arrive as strings.
  - On parse failure, fall back to the raw `initialData` (cast) instead of `{}`, so we never blank the form.
- Apply the same normalization in `MotorcycleListingForm`, `BicycleListingForm`, `WorkerListingForm` (same pattern likely affects them).
- In `UnifiedListingForm`, when `editingProperty.id` is present, also hydrate `videoUrl`, `images`, `location`, **and** map DB-stored joined strings back to arrays for `house_rules`, `amenities`, `services_included`, `vibe`, `skills`, etc., before passing into the sub-form.

---

## 2. Chip-only description builder (no freeform text)

**Scope** — listings (property, motorcycle, bicycle, worker), owner profile, client profile, roommate profile. Remove every "Description / About / Bio" textarea. The composed description shown in previews/insights is auto-built from the chips via `buildDescriptionFromChips`.

**Expand `src/constants/listingTaxonomies.ts`** with richer chip groups:

- `PROPERTY_ADJECTIVES` (positive descriptors): Amazing, Beautiful, Gorgeous, Pretty, Nice, Cool, Incredible, Wonderful, Cute, Charming, Cozy, Stylish, Modern, Bright, Sunny, Stunning, Elegant, Luxurious, Exuberant.
- `PROPERTY_SIZE`: Tiny, Small, Medium, Spacious, Large, Big, Huge, Enormous, Giant.
- `PROPERTY_FEATURES_EXPANDED` adds: Pool (private/shared), 2-in-1 Washer-Dryer, Separate Washer & Dryer, Laundry Room, Dishwasher, Dryer, Rooftop, Terrace, Garage, Carport, Sea view, Mountain view, Garden view, Outdoor kitchen, BBQ, Hot tub, Sauna, Office nook, Walk-in closet.
- New step "Counts": Bedrooms (1–6+), Bathrooms (1–5+), Half-baths, Parking spots — rendered as 40px chip pills (not number inputs) so taps feel intentional.
- Equivalent expansions for moto / bicycle / worker (more positive adjectives + condition + included items).

**Form changes**
- Delete `Title` text input. Title auto-generates from `[Adjective] [Size] [PropertyType] in [City]` (still editable later via a small "Rename" pencil if needed — but no required textarea up front).
- Delete `Description` textarea everywhere — `UnifiedListingForm` already falls back to `buildDescriptionFromChips`, so we just stop showing the textarea.
- Replace `house_rules` joined string write — keep storing as string in DB but always round-trip via array in the form.
- For each `ChipMultiSelect`, give the active state stronger visual feedback so the user can't miss it: filled `bg-primary text-primary-foreground` + scale 1.04 + subtle inner ring. Already mostly correct — bump tap feedback and add a small checkmark glyph on active chips.
- Add a live "Preview description" line under the chips (read-only) that shows the sentence being built so the user sees the impact of each tap.

**Profile / roommate**
- Same pattern: remove `bio` / `description` textareas; replace with chip groups (vibe, traits, lifestyle, languages, work style). Auto-compose the bio string for storage.

---

## 3. Preview / Insights screen polish

Looking at the uploaded screenshot, the Property Preview shows large translucent circles overlaying the hero photo and the close X button is clipped by the rounded card.

- **Remove the circular overlay.** Find and delete the circle/avatar row currently rendered above the image inside `LikedListingInsightsModal` / `ListingPreviewDialog` (likely empty photo-slot placeholders rendered into the preview by mistake). Preview should show only the image carousel.
- **Fix the close button**: move the X out of the rounded card's overflow-hidden region — render it as a fixed top-right floating button with safe-area padding so it isn't clipped.
- **Clean the stats row**: the Beds / Baths cards currently overflow horizontally. Use a 2-up grid (or 4-up on sm+), drop the second card from clipping.
- **Insights view**: replace the cramped circular indicators on top of the photo with a dedicated stats strip below the image (Views / Flames / Quality). The hero photo stays untouched.
- Keep all dark-theme tokens; use `bg-card`, `text-foreground`, `text-muted-foreground` only.

---

## Files to touch

```text
src/constants/listingTaxonomies.ts          (expand chip taxonomies + helpers)
src/components/PropertyListingForm.tsx      (normalize initialData, drop title/desc, add adjective/size/counts chips)
src/components/MotorcycleListingForm.tsx    (same normalization + chip expansion)
src/components/BicycleListingForm.tsx       (same)
src/components/WorkerListingForm.tsx        (same)
src/components/UnifiedListingForm.tsx       (hydrate edit data fully, auto-title, drop description requirement)
src/components/listing/ChipMultiSelect.tsx  (stronger active state + checkmark)
src/components/ListingPreviewDialog.tsx     (remove circle overlay, fix X button, stats row)
src/components/LikedListingInsightsModal.tsx (move stats below photo, drop circular overlays)
src/components/PropertyPreviewDialog.tsx    (same polish)
src/pages/ClientProfileNew.tsx              (drop bio textarea, chip-build it)
src/pages/OwnerProfile.tsx                  (drop bio textarea, chip-build it)
src/pages/RoommateMatching.tsx (profile section) (chip-only)
```

---

## Out of scope

- No DB schema changes — `house_rules`, `description`, `bio` stay as strings; we just stop writing freeform text into them.
- No swipe / navigation changes.
- No new routes.


# Listing Creation: Reliability + Curated Fields + Success UX

Three problems to solve in one pass.

---

## 1. Why "Create Listing" hangs with no error

After reading `src/components/UnifiedListingForm.tsx`:

- The insert payload sets `owner_id` but **never sets `user_id`**. The `listings` table has `user_id NOT NULL` and the RLS INSERT policy is `auth.uid() = user_id`. Insert fails → React Query throws → `onError` fires a toast — but the modal does not close, so it looks like it's "still thinking."
- Photo upload (`uploadPhotoBatch`) has **no timeout** and no granular progress UI. If a single upload stalls (slow network / large image), the whole submit appears frozen.
- The "schema cache" fallback retry path swallows the original error name and only the generic message reaches the user.

### Fix

- Set `user_id: user.user.id` (and keep `owner_id` for backward compatibility) in the insert payload.
- Compress images client-side before upload (reuse the existing compression util used in profile flow), cap at ~1.6 MB each.
- Wrap `uploadPhotoBatch` in `Promise.race` with a 45s timeout per batch. On timeout, throw a clear error.
- Add a visible progress state on the submit button: `Uploading photos… → Saving listing…`.
- Always show error via the unified `NotificationBar` (per memory) instead of relying solely on Sonner.

---

## 2. Replace freeform inputs with curated chip selectors

Goal: stop letting users type free text in describe-yourself / describe-the-object fields. Keep only true free-text where it must remain (title, address, price). Everything else becomes preset multi-select chips.

### New shared component

`src/components/listing/ChipMultiSelect.tsx` — pill-style toggle chips, mobile-first 40px circular buttons (matches existing Structured Filter Engine memory).

### Curated taxonomies (single source of truth)

Create `src/constants/listingTaxonomies.ts` exporting:

**Property**
- `PROPERTY_VIBE`: Quiet, Lively, Family-friendly, Pet-friendly, Beachfront, Jungle, Downtown, Gated, Eco
- `PROPERTY_FEATURES`: Pool, Gym, Parking, AC, WiFi, Security 24/7, Garden, Balcony, Elevator, Storage, Workspace, Washer/Dryer, Smart-home, Solar, Backup water
- `PROPERTY_INCLUDED`: Water, Electricity, Gas, Internet, Cleaning, Maintenance, Trash, Cable TV
- `PROPERTY_RULES`: No smoking, No parties, Quiet hours, Pets allowed, Children welcome, Long-stay only

**Motorcycle**
- `MOTO_TYPE`: Sport, Cruiser, Adventure, Naked, Scooter, Off-road, Touring, Electric
- `MOTO_CONDITION`: Brand new, Like new, Good, Fair, Project
- `MOTO_FEATURES`: ABS, ESC, Traction control, Heated grips, Luggage rack, Crash bars, Quick-shifter, Bluetooth
- `MOTO_INCLUDED`: Helmet, Riding gear, Lock, Top case, Charger, Insurance, Roadside assistance

**Bicycle**
- `BIKE_TYPE`: Road, Mountain, Hybrid, Cruiser, BMX, Folding, Cargo, Electric
- `BIKE_FEATURES`: Suspension front, Suspension full, Disc brakes, Carbon frame, Aluminum frame, Tubeless, Dropper post
- `BIKE_INCLUDED`: Lock, Lights, Basket, Pump, Helmet, Repair kit
- `BIKE_CONDITION`: Brand new, Like new, Good, Fair

**Worker / Service Provider**
- `WORKER_CATEGORY`: Cleaning, Plumbing, Electrical, AC repair, Carpentry, Painting, Gardening, Pool, Moving, Handyman, Pet care, Childcare, Tutoring, Beauty, Massage, Driver, Chef, Photographer, Translator, Tech support
- `WORKER_SKILLS`: Per category (sub-map)
- `WORKER_TRAITS`: Punctual, Detail-oriented, English-speaking, Spanish-speaking, Insured, Background-checked, Own tools, Own vehicle, Emergency available
- `WORKER_AVAILABILITY`: Mornings, Afternoons, Evenings, Weekends, 24/7
- `WORKER_PRICING`: Hourly, Daily, Per-job, Monthly contract

**Owner-as-Client (profile)**
- `OWNER_INTENT`: Looking for tenant, Looking for buyer, Looking to rent out short-term, Hiring workers, Looking for partners
- `OWNER_TRAITS`: Responsive, Flexible, Strict, Pet-friendly host, Family-oriented, Business-only
- `OWNER_LANGUAGES`: English, Spanish, French, German, Italian, Portuguese, Russian, Mandarin

### Form rewrites

- `PropertyListingForm.tsx`: keep title/price/address/sqft as inputs; replace amenities, services, house_rules textarea, vibe with `ChipMultiSelect` groups using the taxonomies above.
- `MotorcycleListingForm.tsx` / `BicycleListingForm.tsx`: drop the `description` textarea entirely; replace with chip groups (type, condition, features, included).
- `WorkerListingForm.tsx`: drop the freeform "about" / "description"; replace with category, skills (filtered by category), traits, availability, pricing chips.
- `OwnerProfile.tsx`: replace any remaining freeform "about you" with `OWNER_INTENT` + `OWNER_TRAITS` + `OWNER_LANGUAGES` chip groups. (Keep the AI Profile Wizard intact — it already extracts into structured fields.)

The auto-generated description shown on insight cards becomes a templated string built from the selected chips (e.g., `"Sport motorcycle · Like new · ABS · Helmet included"`), so listings still read naturally without anyone typing prose.

---

## 3. Success flow: close + notification banner

Currently `ListingSuccessCelebration` plays, but on edit it just toasts. Unify:

- On successful insert/update:
  1. Fire `uiSounds.playUploadComplete()`
  2. Close the wizard modal immediately (`handleClose()`)
  3. Show a `NotificationBar` (top, persistent ~4s): **"Congrats — your listing is live!"** for create, **"Listing updated"** for edit
  4. Invalidate `owner-listings` and `listings` queries
- Same pattern in `AIProfileWizard` and `UnifiedListingForm` profile save: **"Profile saved successfully"**.
- Remove the in-modal celebration overlay (it competes with the banner) — keep the sound only.

---

## Files to change

- `src/components/UnifiedListingForm.tsx` — add `user_id`, upload timeout, progress button states, unified success/close, chip-based forms.
- `src/components/PropertyListingForm.tsx`, `MotorcycleListingForm.tsx`, `BicycleListingForm.tsx`, `WorkerListingForm.tsx` — swap freeform to chips.
- `src/pages/OwnerProfile.tsx` (and `ClientProfileNew.tsx` if a freeform "about" remains) — chip groups.
- `src/components/listing/ChipMultiSelect.tsx` — **new**.
- `src/constants/listingTaxonomies.ts` — **new**.
- `src/components/AIProfileWizard.tsx` — success banner + close.
- `src/utils/photoUpload.ts` — add per-batch timeout helper.

No DB migration needed — all chip selections persist into existing JSONB columns (`amenities`, `services_included`, `skills`, `certifications`, `tools_equipment`, etc.).

---

## Out of scope

- AI auto-listing wizard (already exists, untouched).
- Swipe physics / discovery UI.
- Backend queue refactor — root cause here is missing `user_id`, not Edge Function timeout.

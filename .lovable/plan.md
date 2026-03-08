

# Fix All Missing Form Fields & UI — WorkerListingForm, MotorcycleListingForm, BicycleListingForm, CategorySelector

## Problem

The report claims 15+ fields were added to WorkerListingForm, motorcycle/bicycle forms were updated, and CategorySelector got cascade mode. **None of these changes exist in the current code.** The forms are incomplete — fields defined in the interfaces and saved by UnifiedListingForm have no UI controls.

## What Is Actually Missing

### WorkerListingForm (11 missing UI sections)
The interface defines `description`, `work_type`, `schedule_type`, `days_available`, `time_slots_available`, `location_type`, `skills`, `certifications`, `tools_equipment`, `languages`, `service_radius_km`, `minimum_booking_hours`, `offers_emergency_service`, `background_check_verified`, `insurance_verified` — but the form only renders Service Category, Title, City/Country, Price/Unit, and Experience. **All other fields have zero UI.**

### MotorcycleListingForm (4 missing)
- No `description` textarea
- Missing `has_esc`, `has_luggage_rack`, `includes_gear` checkboxes (DB columns exist)

### BicycleListingForm (2 issues)
- No `description` textarea
- `motor_power` field still in form but **not a DB column** (phantom field that never saves)

### CategorySelector (1 missing behavior)
- No cascade mode toggle: clicking "For Rent" while "For Sale" is active should activate both (and vice versa), not replace

## Changes

### File 1: `src/components/WorkerListingForm.tsx`
Add the following UI sections after the existing cards:

1. **Description textarea** — inside the Service Details card
2. **Work Preferences card** — pill-style toggle chips for `work_type` and `schedule_type` arrays
3. **Availability card** — square day buttons (Mon-Sun) for `days_available` + time slot chips for `time_slots_available`
4. **Service Location card** — location type pills + `service_radius_km` slider + `minimum_booking_hours` input
5. **Skills & Qualifications card** — tag input pattern (type + Enter to add, x to remove) for `skills`, `certifications`, `tools_equipment`, `languages`
6. **Verification & Trust card** — checkboxes for `offers_emergency_service`, `background_check_verified`, `insurance_verified`

All fields already exist in the `WorkerFormData` interface and are already saved by `UnifiedListingForm`'s mutation. This is purely adding missing UI controls.

### File 2: `src/components/MotorcycleListingForm.tsx`
- Add `description` textarea to Basic Information card
- Add `has_esc`, `has_luggage_rack`, `includes_gear` to interface and Features card (2-column grid layout)

### File 3: `src/components/BicycleListingForm.tsx`
- Add `description` textarea to Basic Information card
- Remove `motor_power` from interface and form (not a DB column)
- E-bike section shows only `battery_range` when electric is checked

### File 4: `src/components/CategorySelector.tsx`
- Implement cascade mode: clicking one mode while the other is active → both become active (`'both'`)
- Clicking one mode while both are active → deselects that one, keeps the other
- Visual: active modes get glow effect (`shadow-md shadow-primary/20`) and press animation (`active:scale-[0.96]`)
- Category buttons get rounded pill styling with active glow

## No DB or Backend Changes
All fields already exist in the `listings` table. `UnifiedListingForm` already serializes all these fields in its mutation. The only gap is the missing form controls.


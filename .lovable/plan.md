

# Fix Build Errors and Restore App Functionality

The app is broken due to 4 TypeScript build errors across 4 files. These must be fixed before anything else works (photo uploads, profile creation, listings, etc.).

---

## Error 1: Duplicate `motion` import + missing `X` icon
**File:** `src/components/MessageActivationPackages.tsx`
- Line 10-11: `import { motion } from "framer-motion"` is duplicated. Remove one.
- Line 4: `X` icon from lucide-react is used on line 412 but not imported. Add `X` to the lucide import.

## Error 2: Undefined `categoryId` variable
**File:** `src/components/SimpleSwipeCard.tsx`
- Line 170: `categoryId` is not declared anywhere. Replace with `listing.category`.

## Error 3: `null` vs `undefined` type mismatches
**File:** `src/components/SimpleSwipeCard.tsx`
- Lines 561-585: Properties like `vehicle_brand`, `vehicle_model`, `has_verified_documents`, `rental_duration_type`, `image_url` are typed `string | null` in the `Listing` interface but the card info components expect `string | undefined`. Fix by coercing nulls: e.g., `listing.vehicle_brand ?? undefined`.

## Error 4: `user?.user?.id` — wrong property access
**File:** `src/components/UnifiedListingForm.tsx`
- Line 544: `user?.user?.id` should be `user?.id`. The `useAuth()` hook returns a Supabase `User` object directly, not a wrapper with a nested `.user`.

## Error 5: Missing `cn` import
**File:** `src/pages/OwnerProfileNew.tsx`
- Line 190 uses `cn()` but it is never imported. Add `import { cn } from "@/lib/utils"`.

---

## Impact

These are all compile-time errors that prevent the app from building. Once fixed, the app will render again and all existing functionality (photo uploads, profile creation, listing creation for all categories) will work as before.




# Fix All Build Errors — 6 Files, 12 Errors

These are pre-existing type errors in files that were NOT touched in Round 10, but they block the build. Here's what's wrong and the fix for each.

## 1. `src/components/MyHubActivityFeed.tsx` — Missing `Button` import
**Error:** `Cannot find name 'Button'` (lines 102, 111)
**Fix:** Add `import { Button } from '@/components/ui/button';` to the imports.

## 2. `src/components/MyHubProfileHeader.tsx` — Wrong property names on types
**Errors:**
- `full_name` doesn't exist on `OwnerProfile` → use `business_name`
- `bio` doesn't exist on `OwnerProfile` → use `business_description`
- `location` doesn't exist on either type → use `business_location` for owner, remove for client (or fallback)

**Fix:** Update the profile object construction to use the correct field names from the `OwnerProfile` type (`business_name`, `business_description`, `business_location`).

## 3. `src/components/MyHubQuickFilters.tsx` — Two issues
**Errors:**
- `'moto'` not assignable to `QuickFilterCategory` → must be `'motorcycle'`
- `haptics.selection` doesn't exist → must be `haptics.select`
- Duplicate `import { Zap }` (line 22) — `Zap` already imported at line 4 block but actually NOT there, it's imported standalone after the array. Need to move `Zap` into the main import and remove the duplicate.

**Fix:** Change `'moto'` → `'motorcycle'`, `haptics.selection()` → `haptics.select()`, consolidate Zap import.

## 4. `src/pages/MessagingDashboard.tsx` — `role: string` not assignable to `'client' | 'owner'`
**Error:** The `otherUser` object has `role: string` but `MessagingInterfaceProps` requires `role: 'client' | 'owner'`.
**Fix:** Cast the role: `role: (otherUser.role as 'client' | 'owner') || 'client'` or construct the object with explicit typing.

## 5. `src/pages/MyHub.tsx` — `ListingFilters` type mismatch
**Error:** `category: string | undefined` from `src/types/filters.ts` not assignable to the union type in `smartMatching/types.ts`.
**Fix:** Cast `storeFilters` with `as import('...smartMatching/types').ListingFilters` or use a type assertion on the category field.

## 6. `src/pages/NotificationsPage.tsx` — Three issues
**Errors:**
- `haptics.impact` doesn't exist → use `haptics.tap` (for light) or the direct `triggerHaptic` import
- `Argument of type 'string | undefined'` not assignable to `string` → add nullish coalescing

**Fix:** Replace `haptics.impact('light')` with `haptics.tap()`, add `|| ''` or `!` to the undefined string argument.

---

## Summary

| File | Errors | Fix |
|------|--------|-----|
| MyHubActivityFeed.tsx | 2 | Add Button import |
| MyHubProfileHeader.tsx | 4 | Use correct OwnerProfile field names |
| MyHubQuickFilters.tsx | 2 | `motorcycle` + `haptics.select` + fix Zap import |
| MessagingDashboard.tsx | 1 | Cast role to union type |
| MyHub.tsx | 1 | Type assertion on filters |
| NotificationsPage.tsx | 3 | Replace `haptics.impact` + fix undefined arg |

**Total: 6 files, 12 errors, zero functional changes — pure type fixes.**


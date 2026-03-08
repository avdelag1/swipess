

# Audit Results: Filter System Health Check

## Current State

After a thorough audit of the entire filter pipeline — from UI pages to Zustand store to DB persistence hooks to smart matching queries — the system is **functionally complete and working**. The previous rounds of fixes resolved the critical issues (missing DB table, phantom fields, hydration overwrites, `(supabase as any)` casts on table access).

## Remaining Issues Found

### 1. `ClientFilters` type missing `clientGender`, `clientType`, `categories` (TYPE GAP — causes `as any` casts)
The `ClientFilters` interface in `src/hooks/smartMatching/types.ts` doesn't include `clientGender`, `clientType`, or `categories` fields. The `useSmartClientMatching` hook receives these via the merged `ListingFilters` object from the store, but since the parameter is typed as `ClientFilters`, the code uses `(filters as any).clientGender` everywhere. This doesn't break at runtime but defeats TypeScript's purpose.

**Fix:** Add `clientGender`, `clientType`, and `categories` to the `ClientFilters` interface. Then remove all `(filters as any)` casts in `useSmartClientMatching.tsx` (~12 occurrences).

### 2. Upsert still uses `as any` cast in `useOwnerClientPreferences.ts` (line 70)
The upsert call wraps the payload in `as any`. Since the table now exists in auto-generated types, this can be removed — but only after confirming the spread of `Partial<OwnerClientPreferences>` (which has `[key: string]: any`) doesn't introduce unknown fields. The `[key: string]: any` index signature on the interface is the root cause.

**Fix:** Remove `[key: string]: any` from `OwnerClientPreferences` and remove the `as any` cast on the upsert. Strip any non-DB fields before upserting using a whitelist of known columns.

### 3. `OwnerFilters.tsx` passes `undefined` for cleared age/budget to DB (SILENT DATA ISSUE)
When the user resets age/budget to defaults and clicks Apply, the code sends `min_age: undefined` and `max_age: undefined` to the upsert. Supabase's upsert treats `undefined` values as "don't update this column," meaning old values persist in DB even after reset.

**Fix:** Send `null` instead of `undefined` for cleared filter values so the DB column actually gets cleared.

## Changes

### File 1: `src/hooks/smartMatching/types.ts`
- Add `clientGender?`, `clientType?`, and `categories?` to `ClientFilters` interface

### File 2: `src/hooks/smartMatching/useSmartClientMatching.tsx`
- Remove all `(filters as any)` casts now that the type includes the needed fields (~12 locations)

### File 3: `src/hooks/useOwnerClientPreferences.ts`
- Remove `[key: string]: any` index signature
- Add a column whitelist function that strips non-DB fields before upsert
- Remove `as any` cast on upsert payload

### File 4: `src/pages/OwnerFilters.tsx`
- Change `undefined` to `null` for cleared age/budget values in `handleApply` so DB columns get properly cleared on reset

## Impact
- Zero runtime behavior change for working flows
- TypeScript will now catch typos in filter field names at compile time
- Filter reset actually clears DB values instead of leaving stale data
- Cleaner, more maintainable codebase with no hidden `any` escape hatches


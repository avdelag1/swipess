

# Fix Core Flows: Profile Save, Listing Upload, Legal Verification, and Zones

## Issues Identified

### 1. Listing Upload Error: `video_url` column missing from `listings` table
The `UnifiedListingForm.tsx` (line 191) sends `video_url` in the insert/update payload, but the database schema (types.ts) shows NO `video_url` column exists in the `listings` table. This causes the insert to fail silently or with an error since the form uses `as any` to bypass TypeScript checks.

**Fix:** Add a `video_url` column to the `listings` table via database migration.

### 2. Profile Save Error
The "ERROR SAVING PROFILE" shown in the screenshot is likely caused by the profile sync to the `profiles` table failing — possibly a transient auth issue or a field mismatch. The code currently throws the sync error up to the user. We should make profile sync non-blocking (log errors, don't fail the save).

**Fix:** In `useClientProfile.ts`, wrap the profiles table sync in a try/catch so a sync failure doesn't prevent the client_profiles save from succeeding. Same defensive pattern already exists in `useOwnerProfile.ts` (it logs but doesn't throw).

### 3. Legal Verification Section Not Clickable
The Legal Verification card in `UnifiedListingForm.tsx` (lines 569-590) is a static `<div>` with no `onClick` handler. It looks interactive (has a ChevronRight arrow) but does nothing.

**Fix:** Make it navigate to the Document Vault page (`/documents`) where users can upload legal documents, or open a file upload flow inline.

### 4. Zones Page Shows Nothing (First Explore Link)
The `/explore/zones` route renders `NeighborhoodMap.tsx` which queries `neighborhood_data` table. If the table has no data, the page shows blank. 

**Fix:** Add empty-state UI with a message like "No zones available yet" so users aren't confused by a blank page.

### 5. Enforce "1 Photo Minimum" for Profiles
The user wants profiles to require at least one photo but no other field should be mandatory. Currently the `ClientProfileDialog` and `OwnerProfileDialog` don't enforce any photo requirement.

**Fix:** Add a check in both profile dialogs: if `profileImages.length < 1`, show an error toast and prevent save.

## Database Migration

Add `video_url` column to `listings` table:

```sql
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS video_url text;
```

## File Changes

| File | Change |
|------|--------|
| `src/hooks/useClientProfile.ts` | Wrap profiles sync in try/catch so sync failure doesn't block save |
| `src/components/ClientProfileDialog.tsx` | Add 1-photo minimum check before save |
| `src/components/OwnerProfileDialog.tsx` | Add 1-photo minimum check before save |
| `src/components/UnifiedListingForm.tsx` | Make Legal Verification section clickable (navigate to `/documents`) |
| `src/pages/NeighborhoodMap.tsx` | Add empty-state UI when no zones data exists |


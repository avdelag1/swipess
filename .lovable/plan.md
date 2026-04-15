

## Remove Maintenance/Outage Gate and Fix Runtime Error

### Goal
Strip the maintenance mode system so the app is always live and ready for Apple App Store review. Also fix the "Component is not a function" runtime error.

### Changes

**1. Clean up `src/App.tsx`**
- Remove the `AppOutagePage` import and `APP_STATUS`/`hasOutageBypass` imports
- Remove the `outageBypassed` state and the early-return maintenance gate (lines 108-112)
- Keep everything else intact

**2. Delete maintenance/outage files**
- Delete `src/config/outage.ts`
- Delete `src/components/AppOutagePage.tsx`

**3. Fix runtime error**
- The "Component is not a function" error likely comes from a lazy import. Will investigate and fix the broken lazy route during implementation.

**4. Update memory**
- Remove the maintenance mode memory entry since the feature no longer exists.

### Files touched
- `src/App.tsx` (edit)
- `src/config/outage.ts` (delete)
- `src/components/AppOutagePage.tsx` (delete)


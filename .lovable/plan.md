
## Bug Fixes & Stability Audit for SwipesS

### Root Cause Analysis

After thorough code inspection, I found **4 critical bugs** causing profile saves and photo operations to silently fail, plus several secondary issues.

---

### Critical Bug #1: Wrong Column in `profiles` Table Sync (Silent Save Failure)

**Files:** `src/hooks/useClientProfile.ts`, `src/hooks/useOwnerProfile.ts`, `src/utils/photoUpload.ts`, `src/hooks/useProfileSetup.tsx`

The `profiles` table has two UUID columns:
- `id` — auto-generated primary key (`gen_random_uuid()`)
- `user_id` — the Supabase auth user's ID (the FK reference)

**Every sync operation uses `.eq('id', uid)` where `uid` is `auth.user.id`** — this never matches any row because the auth UID lives in `user_id`, not `id`. The updates run silently with zero rows affected, so no error is thrown but nothing is saved.

**Fixes required:**
- `useClientProfile.ts` line 200: `.eq('id', uid)` → `.eq('user_id', uid)`
- `useOwnerProfile.ts` line 125: `.eq('id', uid)` → `.eq('user_id', uid)`
- `photoUpload.ts` line 79: `.eq('id', userId)` → `.eq('user_id', userId)`
- `useProfileSetup.tsx` lines 159–161 (onboarding update): `.eq('id', user.id)` → `.eq('user_id', user.id)`

---

### Critical Bug #2: `useProfileSetup.tsx` — Profile Existence Check Wrong Column

**File:** `src/hooks/useProfileSetup.tsx`

The profile existence check queries `.select('id').eq('id', user.id)` — again matching the `id` (PK) column not `user_id`. This means it always returns null, triggering a new profile creation on every sign-in, causing duplicate-key conflicts or wasted DB writes.

**Fix:** `.eq('id', user.id)` → `.eq('user_id', user.id)` in the profile existence check, and all subsequent profile update calls.

---

### Critical Bug #3: Owner Profile Dialog — `service_offerings` Blocks Save

**File:** `src/components/OwnerProfileDialog.tsx`

The save button is disabled when `serviceOfferings.length === 0`. For existing owners who haven't set service offerings yet, this blocks them from saving ANY profile update (even name, contact info, or photos). This is an unjustified hard block.

**Fix:** Remove the `serviceOfferings.length === 0` condition from the button `disabled` prop, keeping only `saveMutation.isPending`. Add a non-blocking warning label instead.

---

### Critical Bug #4: `photoUpload.ts` — `updateProfilePhoto` Uses Wrong Column

**File:** `src/utils/photoUpload.ts`

`updateProfilePhoto` calls `.eq('id', userId)` to update `avatar_url`. Since `userId` is the auth UID stored in `user_id`, not `id`, the `avatar_url` is never persisted.

**Fix:** `.eq('id', userId)` → `.eq('user_id', userId)`

---

### Secondary Bug #5: `useClientProfile.ts` sync — `syncPayload.length` check on `updated_at`

The `syncPayload` always contains `updated_at`, so `Object.keys(syncPayload).length > 0` is always true even if nothing real changed. This causes spurious DB writes. Not a breaking bug, but wasteful. Will add a flag to only sync if real fields changed.

---

### Secondary Bug #6: Listing Form — Image Upload `folder` Path

**File:** `src/components/ImageUpload.tsx`

The `folder` default is `'uploads'` but listing images are stored in `'listing-images'` bucket. The `UnifiedListingForm` uses a separate `uploadPhotoBatch` utility that correctly uses the `listing-images` bucket. The `ImageUpload` component is a separate UI component. No issue here, but worth noting that `ImageUpload` in listings context should be passed `bucket="listing-images"` and a proper folder path. Will verify usage.

---

### Implementation Plan

**Files to edit:**

1. **`src/hooks/useClientProfile.ts`**
   - Line 200: Fix `.eq('id', uid)` → `.eq('user_id', uid)` in profiles sync

2. **`src/hooks/useOwnerProfile.ts`**
   - Line 125: Fix `.eq('id', uid)` → `.eq('user_id', uid)` in profiles sync

3. **`src/utils/photoUpload.ts`**
   - Line 79: Fix `.eq('id', userId)` → `.eq('user_id', userId)` in `updateProfilePhoto`

4. **`src/hooks/useProfileSetup.tsx`**
   - Fix all `.eq('id', user.id)` → `.eq('user_id', user.id)` throughout the file
   - Fix profile existence check column
   - Fix onboarding update column

5. **`src/components/OwnerProfileDialog.tsx`**
   - Remove the `serviceOfferings.length === 0` from the Save button's `disabled` prop
   - Keep the warning label as UI hint (not a hard block)

---

### Technical Details

```text
profiles table structure:
  id         | uuid | PK | gen_random_uuid()   ← NOT the auth UID
  user_id    | uuid | FK | auth.users.id        ← IS the auth UID

All queries filtering by the logged-in user MUST use:
  .eq('user_id', authUser.id)     ✅ correct
  .eq('id', authUser.id)          ❌ wrong - never matches
```

This single root-cause mistake (wrong column name) explains why profiles appear to save in the UI (no error thrown) but changes never persist after page reload.

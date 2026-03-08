

# Continued Audit: 4 Critical `id` vs `user_id` Column Mismatches

All four issues are the same class of bug: querying the `profiles` table with `.eq('id', ...)` when the value is an auth user UUID. The `profiles.id` is an auto-generated row UUID, while `profiles.user_id` holds the auth UUID. These lookups always return `null`.

## Issue 1: OwnerViewClientProfile.tsx — Client Profile Never Loads

**File**: `src/pages/OwnerViewClientProfile.tsx` line 32
**Bug**: `.eq('id', clientId)` — `clientId` from URL param is a user UUID
**Impact**: When an owner clicks to view a client's profile, it always shows "Profile not found"
**Fix**: Change to `.eq('user_id', clientId)`

## Issue 2: useProfileRecycling.ts — Recycling Check Always Fails

**File**: `src/hooks/useProfileRecycling.ts` lines 106-107, 110
**Bug**: `.in('id', profileIds)` and `p.id === card.viewed_profile_id` — `viewed_profile_id` stores user UUIDs
**Impact**: Profile recycling never correctly identifies updated profiles, so passed profiles never resurface even after updates
**Fix**: Change to `.in('user_id', profileIds)`, select `user_id`, and match by `p.user_id`

## Issue 3: useProfileSetup.tsx — Referral Verification Always Fails

**File**: `src/hooks/useProfileSetup.tsx` lines 63-64 and 436-437
**Bug**: `.eq('id', referrerId)` — referrerId is a user UUID from referral link
**Impact**: Referral rewards never get granted because the referrer existence check always returns null
**Fix**: Change both instances to `.eq('user_id', referrerId)`

## Issue 4: useAccountLinking.tsx — OAuth Profile Update Silently Fails

**File**: `src/hooks/useAccountLinking.tsx` line 124
**Bug**: `.eq('id', existingProfile.id)` — `existingProfile.id` is the auth user UUID from `check_email_exists` RPC
**Impact**: When linking an OAuth account, profile metadata (avatar, name) never gets updated
**Fix**: Change to `.eq('user_id', existingProfile.id)`

## Implementation

Four code-only fixes. No database changes needed.

1. `OwnerViewClientProfile.tsx`: `.eq('id', clientId)` → `.eq('user_id', clientId)`
2. `useProfileRecycling.ts`: `.in('id', profileIds)` → `.in('user_id', profileIds)`, select + match by `user_id`
3. `useProfileSetup.tsx`: Two instances of `.eq('id', referrerId)` → `.eq('user_id', referrerId)`
4. `useAccountLinking.tsx`: `.eq('id', existingProfile.id)` → `.eq('user_id', existingProfile.id)`


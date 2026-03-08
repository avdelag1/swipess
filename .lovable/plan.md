

# Audit: Token Schema Mismatch + More Ghost References

## Summary

The `tokens` table exists but its schema does **not match** what the code expects. Plus there are 2 more ghost tables and 1 ghost column. This is the last major batch of silent failures.

---

## Bug 1: `tokens` Table Column Mismatch (CRITICAL)

**Database has:** `id, user_id, amount, token_type, source, created_at, updated_at`

**Code inserts these non-existent columns:**
- `activation_type` — used in `useProfileSetup.tsx` and `PaymentSuccess.tsx`
- `total_activations`, `remaining_activations`, `used_activations` — used everywhere
- `expires_at`, `reset_date`, `notes` — used in inserts

Every token insert silently fails. Welcome bonuses, referral rewards, and payment-activated tokens are never created.

**Files affected:**
- `src/hooks/useProfileSetup.tsx` (lines 73-101, 408-472) — welcome + referral token grants
- `src/pages/PaymentSuccess.tsx` (lines 139-185) — subscription + pay-per-use token grants
- `src/hooks/useMessageActivations.ts` (lines 16-18) — reads `activations_remaining` (doesn't exist, column is `amount`)

**Fix:** Rewrite all token inserts/reads to use the actual columns: `amount`, `token_type`, `source`. Map the old activation types to `token_type` and activation counts to `amount`.

## Bug 2: `listings.views` Column Doesn't Exist

`PublicListingPreview.tsx` line 73 updates `views` column on listings — no such column exists. The view counter silently fails and always shows 0.

**Fix:** Remove the view count increment and display, or add a `views` integer column to listings via migration.

## Bug 3: `legal_document_quota` Table Doesn't Exist

`PaymentSuccess.tsx` line 158 upserts into `legal_document_quota` — table doesn't exist. Legal document quotas from subscription purchases are silently lost.

**Fix:** Create the table, or remove the dead code if legal document quotas aren't needed yet.

## Bug 4: `dispute_reports` Table Doesn't Exist

`useContracts.tsx` line 292 inserts into `dispute_reports` — table doesn't exist. Users cannot file contract disputes.

**Fix:** Create the table, or remove the dead code.

## Bug 5: `contracts` Storage Bucket Doesn't Exist

`useContracts.tsx` line 98 and `ContractSigningDialog.tsx` line 72 use a `contracts` storage bucket that doesn't exist (only `listing-images` and `profile-images` exist). Contract file uploads silently fail.

**Fix:** Create the storage bucket, or defer if contracts aren't launched yet.

---

## Implementation Plan

### 1. DB Migration — Fix `tokens` schema + add missing tables/columns
- Add columns to `tokens`: `activation_type text`, `total_activations int DEFAULT 0`, `remaining_activations int DEFAULT 0`, `used_activations int DEFAULT 0`, `expires_at timestamptz`, `reset_date date`, `notes text`
- Add `views integer DEFAULT 0` to `listings`
- Create `legal_document_quota` table: `id, user_id, monthly_limit, used_this_month, reset_date, created_at, updated_at` with RLS
- Create `dispute_reports` table: `id, contract_id, reported_by, reported_against, issue_type, description, status, created_at, updated_at` with RLS
- Create `contracts` storage bucket (public: false)

### 2. Code Fix — `useMessageActivations.ts`
- Change `activations_remaining` read to use correct column name (`remaining_activations` after migration, or `amount` if we keep simple schema)

### 3. No other code changes needed
All other files already use the column names that will now exist after migration.

---

## After This

With these fixes, every `(supabase as any)` call in the codebase will target real tables with real columns. The remaining uses of `(supabase as any)` are just TypeScript bypass casts on tables that exist and have correct columns — they work fine, just need the generated types to be regenerated.


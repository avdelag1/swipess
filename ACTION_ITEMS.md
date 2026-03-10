# 📋 Swipess Audit - Action Items Checklist

_Last updated: 2026-03-10 | [Full Audit 03-10](./FULL_AUDIT_2026_03_10.md) | [Full Audit 03-09](./FULL_AUDIT_2026_03_09.md)_

---

## ✅ RESOLVED

- [x] **Remove hardcoded Supabase credentials from vite.config.ts**
  Fixed: `define` block now only contains `VITE_BUILD_TIME`. Credentials read from `.env` at build time.
  _Resolved between 2026-03-09 and 2026-03-10_

---

## 🔴 CRITICAL (This Sprint - Do Immediately)

### Security — NEW (03-10)
- [ ] **Add auth header check to `ai-orchestrator` edge function**
  **File:** `supabase/functions/ai-orchestrator/index.ts`
  **Do:** Add `Authorization` header check at top of handler. Any unauthenticated request can trigger Gemini/MiniMax API calls at platform cost.
  **ETA:** 1 hour

- [ ] **Add auth check + URL validation to `moderate-image` edge function**
  **File:** `supabase/functions/moderate-image/index.ts`
  **Do:** Add auth header check. Validate `imageUrl` is `https://` and ideally allowlist Supabase storage domain to prevent SSRF.
  **ETA:** 1 hour

### i18n — NEW (03-10)
- [ ] **Wire `t()` translation calls into components — i18n is non-functional**
  **Finding:** `useTranslation` is called in only 1 file (LanguageToggle.tsx). The UI renders hardcoded English everywhere. Spanish translations are built but never rendered.
  **Scope:** 150+ components, 70+ pages — this is a multi-sprint effort
  **Start with:** `BottomNavigation.tsx`, `TopBar.tsx`, `settings/` pages (keys already exist in en.json/es.json)
  **ETA:** 40+ hours total (phase in over multiple sprints)

### Type Safety
- [ ] Install missing TypeScript type definitions
  ```bash
  npm install --save-dev @types/babel__generator @types/babel__template @types/babel__traverse
  npm install --save-dev @types/d3-color @types/d3-path @types/deep-eql @types/prop-types
  ```
  **ETA:** 30 minutes

---

## 🟡 HIGH PRIORITY (Next 2 Sprints)

### Security
- [ ] **Replace localStorage with sessionStorage for payment data**
  **Files:**
  - `src/pages/SubscriptionPackagesPage.tsx` (lines 114-115)
  - `src/components/SubscriptionPackages.tsx` (lines 121-122)
  - `src/components/MessageActivationPackages.tsx` (lines 134, 140)
  - `src/components/TopBar.tsx` (lines 132, 138)
  **Do:** Migrate `PAYMENT_RETURN_PATH_KEY`, `SELECTED_PLAN_KEY`, `PENDING_ACTIVATION_KEY` to `sessionStorage`.
  **ETA:** 2 hours

- [ ] **Complete RLS (Row-Level Security) policies**
  **Tables:** conversations, matches, messages, user_profiles
  **ETA:** 4 hours

### Error Boundaries — NEW (03-10)
- [ ] **Wire `PaymentErrorBoundary` to payment routes in App.tsx**
  **File:** `src/App.tsx` (lines 299-302)
  **Do:** Wrap `/payment/success` and `/payment/cancel` with `<PaymentErrorBoundary>` (component already exists at `src/components/PaymentErrorBoundary.tsx`)
  **ETA:** 30 minutes

### Code Quality
- [ ] **Complete logger deduplication — migrate remaining 9 files from `logger.ts` to `prodLogger.ts`**
  **Files using `@/utils/logger`:**
  - `src/state/swipeDeckStore.ts` ← highest priority (core store)
  - `src/hooks/useMessaging.tsx`
  - `src/hooks/useMessagingQuota.tsx`
  - `src/components/MessageConfirmationDialog.tsx`
  - `src/components/PhotoCrop.tsx`
  - `src/components/PhotoCamera.tsx`
  - `src/components/DirectMessageDialog.tsx`
  - `src/utils/cacheManager.ts`
  After migration, delete `src/utils/logger.ts`.
  **ETA:** 2 hours

- [ ] **Delete `src/utils/clientDiscoveryDebug.ts`**
  7 raw `console.log` statements, flagged since 03-09 audit, still present.
  **ETA:** 5 minutes

- [ ] **Fix misleading comment in `swipeDeckStore.setClientDeck`**
  **File:** `src/state/swipeDeckStore.ts` (lines 175-181)
  The "not appending" branch still appends items. Either rename the logic or add a comment explaining the merge-always behavior.
  **ETA:** 30 minutes

- [ ] **Add error boundary wrapper around payment flows**
  **Files:** `src/pages/SubscriptionPackagesPage.tsx`
  **ETA:** 1 hour

- [ ] **Tighten ESLint configuration**
  **File:** `eslint.config.js`
  Enable `@typescript-eslint/no-explicit-any` (currently `'off'`), restrict `console` to `warn`/`error`.
  **ETA:** 1 hour

### Data Fetching — NEW (03-10)
- [ ] **Extract `supabase.from()` calls from 5 components into dedicated hooks**
  **Components:**
  - `src/components/ClientVerificationFlow.tsx` (2 direct calls)
  - `src/components/VerificationRequestFlow.tsx` (2 direct calls) → create `useVerification.ts`
  - `src/components/MaintenanceRequestForm.tsx` → create `useMaintenanceRequests.ts`
  - `src/components/SubscriptionPackages.tsx` → move into existing `useSubscription.tsx`
  - `src/components/MessageActivationPackages.tsx` → move into existing `useMessageActivations.ts`
  **ETA:** 4 hours

### Testing
- [ ] Create test suite for auth flows
  **ETA:** 8 hours

- [ ] Create test suite for swipe mechanics
  **ETA:** 8 hours

- [ ] Create test suite for payment flows
  **ETA:** 8 hours

### Refactoring
- [ ] Refactor mega-components into sub-components
  1. `SwipessSwipeContainer.tsx` (~1,493 lines)
  2. `ClientSwipeContainer.tsx` (~996 lines)
  3. `ClientProfileDialog.tsx` (~1,085 lines)
  **ETA:** 12 hours

---

## 🔵 MEDIUM PRIORITY (Next Month)

### Security / Edge Functions — NEW (03-10)
- [ ] **Add per-user rate limiting to AI edge functions**
  **Files:** `supabase/functions/ai-orchestrator/index.ts`, `supabase/functions/moderate-image/index.ts`
  **Do:** Track call count per user in Supabase or use Deno KV. Reject >N requests per minute.
  **ETA:** 3 hours

- [ ] **Protect `/payment/success` and `/payment/cancel` with `<ProtectedRoute>`**
  **File:** `src/App.tsx` (lines 299-302)
  **Do:** Nest payment routes inside the ProtectedRoute wrapper.
  **ETA:** 30 minutes

- [ ] **Review `useAuth.tsx:167` exhaustive-deps suppression**
  Confirm the `eslint-disable` is intentional and add an explanatory comment.
  **ETA:** 30 minutes

### Accessibility — NEW (03-10)
- [ ] **Add descriptive `alt` text to swipe card images**
  **Files:** `src/components/SimpleSwipeCard.tsx`, `src/components/SimpleOwnerSwipeCard.tsx`, `src/components/ImageCarousel.tsx`
  **Do:** Replace `alt=""` with `alt={listing.title}` or `alt={profile.name}` for content images.
  **ETA:** 2 hours

- [ ] **Add `aria-label` to swipe action buttons (like, pass, super like)**
  **File:** `src/components/SwipeActionButtonBar.tsx`
  **ETA:** 30 minutes

- [ ] **Add keyboard navigation for swipe interactions**
  Arrow keys to swipe left/right; Enter to super-like.
  **ETA:** 4 hours

### Documentation
- [ ] Create comprehensive README
  **ETA:** 4 hours

- [ ] Add barrel exports for component folders
  **ETA:** 2 hours

### Performance
- [ ] Monitor bundle size after major features
  **ETA:** Ongoing

### Type Safety
- [ ] Convert `Record<string, unknown>` to specific types in edge functions
  **ETA:** 3 hours

---

## 📊 TRACKING

### Metrics (as of 2026-03-10)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Hardcoded credentials | 0 | 0 | ✅ |
| console.log (source) | 0 | 24 | ⚠️ 71% reduced |
| Duplicate logger files | 0 | 2 | ⚠️ |
| Files on wrong logger | 0 | 9 | ⚠️ |
| `useTranslation` usage | ~150 files | 1 file | 🔴 |
| Direct `supabase.from()` in components | 0 | 7 calls | ⚠️ |
| eslint-disable exhaustive-deps | 0 | 3 | ✅ Low |
| Edge functions with auth check | 6/6 | 2/6 | ⚠️ |
| Test coverage | 60%+ | ~10% | ⚠️ |
| ESLint errors | 0 | High | ⚠️ |

### Audit Log

| Date | Audit File | Key Finding |
|------|-----------|-------------|
| 2026-02-27 | AUDIT_REPORT.md | Initial baseline |
| 2026-03-01 | AUDIT_SUMMARY.md | Color theme / hardcoded colors |
| 2026-03-09 | FULL_AUDIT_2026_03_09.md | Security, quality, mega-components |
| 2026-03-10 | FULL_AUDIT_2026_03_10.md | i18n gap, edge function auth, a11y, Zustand |

### Next Audit Scheduled
- **Date:** 2026-03-11
- **Focus:** Verify C1 (edge function auth), H2/H3 (logger dedup), H4 (payment boundary)
- **Expected progress:** Quick wins on the 30-min–2h items above

---

## NOTES FOR TEAM

### Resolved Since Last Audit
✅ **Hardcoded Supabase credentials** — removed from `vite.config.ts`
✅ **console.log reduced** — 82 → 24 (71% reduction)

### Known Limitations
- i18n initialized but UI not using translations (entire feature needs wiring)
- 2 edge functions accept unauthenticated requests (AI cost risk)
- 9 files still use the old `logger.ts` class
- Swipe cards missing descriptive alt text
- Payment pages outside ProtectedRoute

### Quick Wins (< 1 hour each)
1. Delete `clientDiscoveryDebug.ts` — 5 min
2. Wire `PaymentErrorBoundary` to routes — 30 min
3. Add auth check to `moderate-image` — 30 min
4. Fix `swipeDeckStore.ts` logger import — 15 min
5. Add auth check to `ai-orchestrator` — 30 min

---

**Created:** 2026-02-27
**Updated:** 2026-03-10
**Status:** ⏳ IN PROGRESS
**Estimated Total Effort Remaining:** 80–100 hours

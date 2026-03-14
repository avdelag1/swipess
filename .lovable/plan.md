

## Plan: Comprehensive Audit Fix Pass

This addresses the audit findings in priority order across 5 phases. Given the scope, I'll focus on actionable fixes that don't require major refactoring.

---

### Phase 1 — Security Fixes

**1a. Remove hardcoded credentials from `vite.config.ts`**
- The `define` block at line 127-129 only sets `VITE_BUILD_TIME` — the audit's claim about hardcoded Supabase creds in vite.config is actually already fixed (the old `define` block with project ID/key was removed in a prior pass). The preconnect plugin at line 15 uses `process.env.VITE_SUPABASE_URL` which is correct. No change needed here.

**1b. Switch payment data from localStorage to sessionStorage**
Files: `src/pages/SubscriptionPackagesPage.tsx`, `src/pages/PaymentSuccess.tsx`, `src/components/MessageActivationPackages.tsx`
- Replace all `localStorage.getItem/setItem/removeItem` for payment keys (`SELECTED_PLAN_KEY`, `PENDING_ACTIVATION_KEY`, `PAYMENT_RETURN_PATH_KEY`) with `sessionStorage`
- This prevents payment data from persisting after browser close and reduces XSS exposure

**1c. Fix silent `.catch(() => {})` blocks (15+ instances)**
Files: `src/hooks/useSwipeUndo.tsx`, `src/hooks/useSwipeWithMatch.tsx`, `src/hooks/useSwipe.tsx`, `src/hooks/useNotificationSystem.tsx`, `src/components/ImageCarousel.tsx`
- Replace empty catches with `logger.error()` calls so errors are at least logged
- Exception: `audio.play().catch(() => {})` in `src/utils/sounds.ts` is acceptable (browser autoplay policy)

---

### Phase 2 — Logger Consolidation

**Delete `src/utils/clientDiscoveryDebug.ts`** — unused (0 imports)

**Delete `src/utils/logger.ts`** — merge into `prodLogger.ts`
- `logger.ts` is imported by 10 files; `prodLogger.ts` by 95 files
- Update the 10 files importing from `@/utils/logger` to import from `@/utils/prodLogger` instead
- Both have identical API (`log`, `warn`, `error`, `info`, `debug`)

Files to update imports: `swipeDeckStore.ts`, `useMessaging.tsx`, `DirectMessageDialog.tsx`, `MessageConfirmationDialog.tsx`, `PhotoCrop.tsx`, `cacheManager.ts`, `useMessagingQuota.tsx`, `main.tsx`, `PhotoCamera.tsx`, `performanceMonitor.ts` (if it uses logger)

---

### Phase 3 — Repo Hygiene

**Delete temp/log files from root** (15 files):
- `build_failed_log.txt` through `build_failed_log_7.txt`
- `build_final.txt`, `build_fresh.txt`
- `dev_output.log`, `lint-errors.txt`, `lint_final.txt`, `lint_fresh.txt`
- `temp_build_log.txt`, `tsc_output.txt`
- `.commit-fix-swipe.txt`, `.commit-new-backend.txt`, `.commit-old-buttons.txt`, `.commit-ui.txt`
- `diagnose_missing_users.sql`, `test_migration_verification.sql`, `test_schema_diff.sql`

**Delete extra lockfiles**: `bun.lock`, `deno.lock` (keep only `package-lock.json`)

**Update `.gitignore`** to add:
```
# Build/debug logs
build_failed_log*.txt
build_final.txt
build_fresh.txt
dev_output.log
lint-errors.txt
lint_final.txt
lint_fresh.txt
temp_build_log.txt
tsc_output.txt
.commit-*.txt
*.sql.tmp
```

---

### Phase 4 — ESLint Tightening

**File: `eslint.config.js`**
- Change `'no-console': 'off'` → `'no-console': ['warn', { allow: ['warn', 'error'] }]`
- Change `'@typescript-eslint/no-unused-vars'` from `'warn'` → `'error'`
- Keep `no-explicit-any` as `'off'` for now (834 instances is too many for one pass)

---

### Phase 5 — Wrap Payment Flows with Error Boundary

**File: `src/pages/SubscriptionPackagesPage.tsx`**
- Wrap the page content with the existing `<PaymentErrorBoundary>` component

**File: `src/components/MessageActivationPackages.tsx`**
- Same wrapper

---

### Summary

| Phase | Files Changed | Impact |
|-------|--------------|--------|
| Security (payments) | 3 files | sessionStorage for payment data |
| Security (silent catches) | 5 files | Error visibility |
| Logger consolidation | 12 files (10 import updates + 2 deletions) | Single logger source |
| Repo cleanup | ~20 file deletions + .gitignore | Clean root directory |
| ESLint | 1 file | Stricter rules |
| Error boundaries | 2 files | Payment flow resilience |

Total: ~43 file operations. No database changes needed.




# Fix All 30+ Build Errors — Comprehensive Repair

The app is broken because of ~30 TypeScript build errors across 10+ files. Here's a categorized breakdown and the fix for each.

## Error Categories & Fixes

### 1. Missing `@/utils/prodLogger` module (3 files)
`prodLogger.ts` doesn't exist — it was merged into `@/utils/logger.ts`. Three files still import from the old path:
- `src/integrations/supabase/client.ts` — **CANNOT EDIT** (auto-generated). This is a problem.
- `src/hooks/useContentModeration.ts`
- `src/hooks/useImageModeration.ts`

**Fix:** Create `src/utils/prodLogger.ts` as a re-export shim: `export { logger } from './logger';`. This fixes all three files without editing the auto-generated client.

### 2. `NodeJS.Timeout` namespace errors (7 occurrences across 6 files)
TypeScript doesn't know about `NodeJS` namespace in browser context.

**Files:** `CategorySelectionDialog.tsx`, `MessagingInterface.tsx`, `SwipeUtils.tsx`, `RadioContext.tsx`, `useAuth.tsx`, `useFilterPersistence.ts`, `useRealtimeChat.tsx`, `MessagingDashboard.tsx`

**Fix:** Add `/// <reference types="node" />` at the top of each file, OR change `NodeJS.Timeout` to `ReturnType<typeof setTimeout>` in each file. The latter is cleaner for a browser project.

### 3. `InterestPreviewModal.tsx` — Wrong property names (3 errors)
- `images?.[0]` — indexing `Json` type with `[0]` fails (line 212)
- `interested_in_yachts` doesn't exist on `client_filter_preferences` (line 235)
- `max_price` doesn't exist — should be `price_max` (lines 238, 240)

**Fix:** Cast `listing.images` as `string[]`, replace `interested_in_yachts` with `interested_in_vehicles`, replace `max_price` with `price_max`.

### 4. `PropertyInsightsDialog.tsx` — `unknown` type in JSX (8 errors)
`rental_rates` is `Record<string, unknown>`, so `.hourly`, `.daily`, `.weekly`, `.monthly` return `unknown` which can't be rendered in JSX.

**Fix:** Cast values with `as React.ReactNode` or `String(...)` when rendering, e.g., `${String(listing.rental_rates.hourly)}`.

### 5. `SwipessSwipeContainer.tsx` — Duplicate `PrefetchScheduler` (2 errors + 1 warning)
- Line 9: `import { PrefetchScheduler }` from `@/lib/swipe/PrefetchScheduler`
- Line 48: `import { PrefetchScheduler }` from `./swipe/SwipeUtils`
- Line 988: `if (condition)` always true warning

**Fix:** Remove the duplicate import on line 9 (keep the one from SwipeUtils at line 48). Fix the redundant nested `if` at line 990.

### 6. `RadioPlayer.tsx` — Missing `navigate` (line 69)
`useNavigate` is not imported/called.

**Fix:** Add `const navigate = useNavigate();` and ensure `useNavigate` is imported from `react-router-dom`.

### 7. `useAuth.tsx` — `signIn` return type mismatch
The `signIn` function can return `undefined` (implicit) in some code paths, but the interface requires `Promise<{ error: ... }>`.

**Fix:** Add `return { error: null };` at the end of the `signIn` function to cover all paths.

### 8. `useListings.test.tsx` — Missing `waitFor` export
`@testing-library/react` doesn't export `waitFor` in the installed version.

**Fix:** Remove the `waitFor` import or replace with the correct import path.

---

## Summary

| Category | Files | Fix |
|----------|-------|-----|
| Missing prodLogger | 3 | Create re-export shim |
| NodeJS.Timeout | 6-8 | Use `ReturnType<typeof setTimeout>` |
| InterestPreviewModal | 1 | Fix property names + cast |
| PropertyInsightsDialog | 1 | Cast `unknown` to `string` in JSX |
| SwipessSwipeContainer | 1 | Remove duplicate import, fix nested if |
| RadioPlayer | 1 | Add useNavigate |
| useAuth signIn | 1 | Add missing return |
| Test file | 1 | Fix waitFor import |

**Total: ~30 errors across ~12 files. All pure type/import fixes — zero functional changes.**


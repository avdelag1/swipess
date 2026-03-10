# Full Application Audit — 2026-03-09

## Executive Summary

**App:** Swipess — swipe-based marketplace (properties, vehicles, services)
**Stack:** React 18 + TypeScript + Vite + Supabase + Capacitor
**Status:** Production-Ready with known hygiene debt
**Risk Level:** LOW-MEDIUM
**Cleanup Effort Estimated:** 40–60 hours

---

## 1. Security

### 1.1 Hardcoded Supabase Credentials in vite.config.ts — CRITICAL

**File:** `vite.config.ts` lines 129–132

```ts
define: {
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://qegyisokrxdsszzswsqk.supabase.co'),
  'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
  'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify('qegyisokrxdsszzswsqk'),
}
```

These are baked into the production bundle. While the anon key is technically public, hardcoding it defeats environment-based configuration management and exposes the project ID universally.

**Fix:** Remove from `define` block entirely. Use only `.env` / `.env.local`. Update CI to inject env vars at build time.

---

### 1.2 localStorage Used for Payment and Session Data — HIGH

**Files:**
- `src/components/TopBar.tsx` — pending activation, payment return path
- `src/components/MessageActivationPackages.tsx` — payment data
- `src/components/SubscriptionPackages.tsx` — selected plan
- `src/components/LegendaryLandingPage.tsx` — auth email

localStorage is readable by any JS running on the page (XSS vector). Payment-related values must not persist across browser restarts.

**Fix:** Migrate all payment-related keys to `sessionStorage`. Keep only non-sensitive preferences in localStorage.

---

### 1.3 Incomplete Row-Level Security — MEDIUM

RLS policies are not fully defined for:
- `conversations` — should only be visible to participants
- `matches` — should be visible to both matched parties
- `messages` — should be scoped to conversation participants

**Fix:** Add explicit RLS policies per the schema design. Test with unprivileged Supabase user.

---

### 1.4 XSS via dangerouslySetInnerHTML — LOW (mitigated)

**Files:**
- `src/components/ContractDocumentDialog.tsx`
- `src/components/DocumentEditor.tsx`
- `src/components/ui/chart.tsx`

DOMPurify is used before rendering. Risk is low but review periodically if DOMPurify is updated or policy changes.

---

### 1.5 CORS Wildcard in Edge Functions — LOW (acceptable)

All edge functions use `"Access-Control-Allow-Origin": "*"`. Acceptable for public APIs, but verify that sensitive endpoints require the Supabase `Authorization` header.

---

## 2. Code Quality

### 2.1 Duplicate Logger Implementations — HIGH

**Files:**
- `src/utils/logger.ts` — 119-line class-based logger
- `src/utils/prodLogger.ts` — 141-line simple object wrapper

23+ files use one or the other inconsistently. Both end up in the production bundle.

**Fix:** Choose one (recommend `prodLogger`), delete the other, update imports in 3 legacy files, add ESLint path alias rule.

---

### 2.2 Silent Error Catches — HIGH

15+ locations swallow errors silently:

```ts
.catch(() => { })  // no logging, no recovery
```

**Locations include:**
- `useNotificationSystem.tsx:214`
- `useSwipeUndo.tsx` (3×)
- `useSwipe.tsx` (5×)
- `useSwipeWithMatch.tsx` (3×)
- `SwipessSwipeContainer.tsx:793`
- `ImageCarousel.tsx:104`
- `ClientSwipeContainer.tsx:566`

**Fix:**
```ts
.catch((err) => {
  logger.error('[ComponentName] operation failed:', err);
})
```

---

### 2.3 834 Uses of `any` Type — MEDIUM

ESLint rule `@typescript-eslint/no-explicit-any` is set to `'off'`, disabling type safety enforcement.

**Fix:** Set to `'warn'`, then progressively tighten to `'error'`. Address high-traffic files first.

---

### 2.4 82 console.log Statements — MEDIUM

ESLint rule `no-console` is `'off'`. Vite removes them in production, but they remain in source and pollute development logs.

**Fix:** Set `'no-console': ['warn', { allow: ['warn', 'error'] }]`. Replace with `logger.*` calls.

---

### 2.5 Oversized Components — MEDIUM

| Component | Lines |
|-----------|-------|
| `SwipessSwipeContainer.tsx` | ~1,493 |
| `DashboardLayout.tsx` | ~833 |
| `ClientProfileDialog.tsx` | ~1,085 |
| `SwipeInsightsModal.tsx` | ~970 |
| `ClientSwipeContainer.tsx` | ~996 |
| `MessagingDashboard.tsx` | ~546 |

Components over ~400 lines are hard to test, debug, and maintain.

**Fix:** Extract sub-components and custom hooks. Target <300 lines per component file.

---

## 3. Architecture

### 3.1 App.tsx Route Sprawl — MEDIUM

100+ lazy-loaded routes in a single component. Role-based routing logic is mixed with route declarations.

**Fix:** Extract route definitions into `src/routes/clientRoutes.ts`, `ownerRoutes.ts`, `adminRoutes.ts`. Keep App.tsx as a thin orchestrator.

---

### 3.2 Directives / Execution Layer Not Implemented — LOW

CLAUDE.md defines a 3-layer architecture. No `directives/` folder exists. Only one execution script (`execution/deploy_edge_function.py`) is present.

**Fix:** Create the directives folder. Add SOPs for key recurring operations (e.g., schema migrations, edge function deploys).

---

### 3.3 Service Worker Update Frequency — LOW

`main.tsx` checks for SW updates every 60 seconds and calls `skipWaiting()` to auto-activate. This can interrupt active user sessions mid-flow (e.g., mid-payment).

**Fix:** Increase interval to 5–15 minutes. Replace auto-activation with user-prompt approach for non-critical updates.

---

## 4. Testing

### 4.1 Current Coverage — CRITICAL GAP

Only 5 test files exist across ~160+ components and hooks. Estimated coverage: <10%.

| Test File | Coverage Target |
|-----------|----------------|
| `auth-flow.test.tsx` | Auth flows ≥80% |
| `SimpleSwipeCard.test.tsx` | Swipe mechanics ≥70% |
| (missing) payment flow tests | Payment flows ≥75% |
| (missing) messaging tests | Messaging ≥60% |

**Fix:**
1. Add Vitest coverage thresholds to `vite.config.ts`
2. Write integration tests for auth, payment, swipe, messaging critical paths
3. Add CI step: fail if coverage drops below thresholds

---

## 5. Performance

### 5.1 Strengths
- Lazy-loaded routes (61 pages) — good
- requestIdleCallback for deferred init — good
- Tanstack Virtual for long lists — good
- Rollup chunk splitting by feature — good

### 5.2 Concerns

**Bundle analyzer:** `stats.html` is generated but presumably not monitored in CI.

**Fix:** Add CI step to emit bundle size report and warn if total grows >10% per PR.

---

## 6. Color / UI Consistency

AUDIT_REPORT_COLOR_THEME.md identified 72 components with hardcoded Tailwind colors bypassing the design system:
- 9 critical
- 15 high-priority
- 48 medium-priority

`src/utils/colors.ts` exists as a semantic color utility — it should be enforced via ESLint custom rule or code review checklist.

---

## 7. Database

### 7.1 Strengths
- 18 core tables, well-organized
- 35+ strategic indexes
- Comprehensive schema documentation

### 7.2 Gaps
- Incomplete RLS (see Security §1.3)
- No automated migration tests

---

## 8. Dependencies

### 8.1 Lock File Mismatch
`npm list` shows UNMET DEPENDENCIES — likely bun/npm lock file conflict. `npm install` or `bun install` should resolve.

### 8.2 Missing @types Packages
Several Babel-related `@types` packages are listed in ACTION_ITEMS as missing. Confirm with `npm ls @types/babel__traverse` etc.

---

## 9. Prioritized Action Items

### Immediate (Week 1)
| # | Item | Effort |
|---|------|--------|
| 1 | Remove hardcoded credentials from vite.config.ts | 30 min |
| 2 | Consolidate loggers (pick one, delete other) | 3 hr |
| 3 | Migrate payment storage: localStorage → sessionStorage | 2 hr |
| 4 | Add logging to 15+ silent catches | 4 hr |

### Short-Term (Weeks 2–3)
| # | Item | Effort |
|---|------|--------|
| 5 | Write auth/swipe/payment test suites | 24 hr |
| 6 | Add RLS policies for conversations/matches/messages | 4 hr |
| 7 | Refactor top 3 mega-components | 12 hr |
| 8 | Fix 9 critical color theme components | 3 hr |

### Medium-Term (Month 1)
| # | Item | Effort |
|---|------|--------|
| 9 | Enable no-explicit-any: warn, reduce any count | 8 hr |
| 10 | Add CI: test coverage gates + bundle size monitoring | 4 hr |
| 11 | Fix remaining 63 color theme components | 12 hr |
| 12 | Extract App.tsx routes into separate config files | 3 hr |

---

## 10. Risk Matrix

| Area | Severity | Likelihood | Priority |
|------|----------|------------|----------|
| Hardcoded credentials | High | Certain | P0 |
| localStorage payment data | High | Medium | P0 |
| Silent error catches | Medium | High | P1 |
| Incomplete RLS | Medium | Medium | P1 |
| No test coverage | Medium | High | P1 |
| Duplicate loggers | Low | Certain | P2 |
| Mega-components | Low | Low | P2 |
| Color inconsistency | Low | Low | P3 |
| SW update frequency | Low | Low | P3 |

---

*Audit performed: 2026-03-09*

# 📋 Swipess Audit - Action Items Checklist

## 🔴 CRITICAL (This Sprint - Do Immediately)

### Type Safety
- [ ] Install missing TypeScript type definitions
  ```bash
  npm install --save-dev @types/babel__generator @types/babel__template @types/babel__traverse
  npm install --save-dev @types/d3-color @types/d3-path @types/deep-eql @types/prop-types
  ```
  **Owner:** [Assign to]  
  **ETA:** 30 minutes  
  **Priority:** 🔴 BLOCKING

### Error Handling
- [ ] Add error boundary wrapper around payment flows
  **Files:** src/pages/SubscriptionPackagesPage.tsx  
  **Owner:** [Assign to]  
  **ETA:** 1 hour  
  **Do:** Catch errors with user-friendly messages instead of throwing

### Security / localStorage
- [ ] Replace localStorage with sessionStorage for sensitive payment data
  **Files:**
  - src/pages/SubscriptionPackagesPage.tsx
  - src/pages/PaymentSuccess.tsx
  
  **Owner:** [Assign to]  
  **ETA:** 1 hour  
  **Do:** Only store planId, validate prices server-side

---

## 🟡 HIGH PRIORITY (Next 2 Sprints)

### Code Quality
- [ ] Consolidate duplicate logger modules
  **Files:**
  - Delete: src/utils/clientDiscoveryDebug.ts
  - Deprecate: src/utils/prodLogger.ts → merge into src/utils/logger.ts
  - Update: All imports across the app
  
  **Owner:** [Assign to]  
  **ETA:** 3 hours  
  **Impact:** Single source of truth for logging

- [ ] Tighten ESLint configuration
  **File:** eslint.config.js  
  **Changes:**
  - Enable @typescript-eslint/no-explicit-any (currently 'off')
  - Change @typescript-eslint/no-unused-vars to 'error' (currently 'warn')
  - Restrict console to warn/error only
  
  **Owner:** [Assign to]  
  **ETA:** 1 hour

### Testing
- [ ] Create test suite for auth flows
  **Files:** src/test/auth-flow.test.tsx (expand)  
  **Coverage Goal:** ≥ 80% of auth logic  
  **Owner:** [Assign to]  
  **ETA:** 8 hours

- [ ] Create test suite for swipe mechanics
  **New File:** src/test/swipe.test.tsx  
  **Coverage Goal:** ≥ 70% of swipe logic  
  **Owner:** [Assign to]  
  **ETA:** 8 hours

- [ ] Create test suite for payment flows
  **New File:** src/test/payment.test.tsx  
  **Coverage Goal:** ≥ 75% of payment handling  
  **Owner:** [Assign to]  
  **ETA:** 8 hours

### Database
- [ ] Complete RLS (Row-Level Security) policies
  **File:** supabase/migrations/  
  **Add Policies For:**
  - [ ] Conversations table (private to participants)
  - [ ] Matches table (visible to both parties)
  - [ ] User profiles (visibility rules)
  - [ ] Messages table (secure)
  
  **Owner:** [Assign to]  
  **ETA:** 4 hours

### Refactoring
- [ ] Refactor mega-components into sub-components
  **Priority Order:**
  1. SwipessSwipeContainer.tsx (1500+ lines estimated)
  2. ConversationalListingCreator.tsx (541 lines)
  3. MessagingDashboard.tsx (546 lines)
  
  **Owner:** [Assign to]  
  **ETA:** 12 hours total (spread across sprint)

---

## 🔵 MEDIUM PRIORITY (Next Month)

### Documentation
- [ ] Create comprehensive README
  **Should Include:**
  - Project architecture diagram
  - State management flow chart
  - API integration guide
  - Environment setup
  - Contributing guidelines
  
  **Owner:** [Assign to]  
  **ETA:** 4 hours

- [ ] Create API/Supabase integration guide
  **Owner:** [Assign to]  
  **ETA:** 2 hours

- [ ] Document component hierarchy
  **Owner:** [Assign to]  
  **ETA:** 2 hours

### Code Organization
- [ ] Add barrel exports (index.ts) for component folders
  **Files:**
  - src/components/index.ts
  - src/pages/index.ts
  - src/hooks/index.ts
  - src/utils/index.ts
  
  **Owner:** [Assign to]  
  **ETA:** 2 hours

### Performance
- [ ] Monitor bundle size
  ```bash
  npm run build
  # Check rollup-plugin-visualizer output
  ```
  **Owner:** [Assign to]  
  **ETA:** 30 minutes  
  **Ongoing:** Review after each major feature

### Type Safety
- [ ] Convert Record<string, unknown> to specific types
  **Files:**
  - supabase/functions/send-push-notification/index.ts
  - supabase/functions/ai-orchestrator/index.ts
  
  **Owner:** [Assign to]  
  **ETA:** 3 hours

---

## 📊 TRACKING

### Next Audit Scheduled
- **Date:** April 27, 2026
- **Focus:** Verify all action items completed
- **Expected Score:** 7.5/10+

### Metrics to Monitor
- [ ] TypeScript strict mode compliance: Target 100%
- [ ] Test coverage: Target 60%+
- [ ] Bundle size: Target <150KB gzip
- [ ] ESLint errors: Target 0
- [ ] Production error rate: Track via sentry/logging

---

## NOTES FOR TEAM

### Recent Fixes Applied
✅ **Lazy-loading primitive error** fixed in PR #[TBD]
- ConversationalListingCreator converted to default export
- MessagingDashboard converted to default export
- Simplified lazy imports in App.tsx

### Known Limitations
- Only 2 test files (minimal coverage)
- 3 different logger patterns (consolidation needed)
- Large components need refactoring (technical debt)
- Bundle size not actively monitored (add to CI/CD)

### Recommended Process for Team
1. Assign owners to each item above
2. Create GitHub issues for each task
3. Link to this checklist in project management
4. Review progress weekly
5. Update completion dates as you go

---

## Questions / Notes

**Q: Why prioritize tests over refactoring?**
A: Tests prevent regressions in critical features (auth, payments). Refactoring without tests is risky.

**Q: Why consolidate loggers?**
A: Three similar patterns = maintenance burden. One logger = consistent practices.

**Q: How do we monitor bundle size?**
A: Run `npm run build` after major features. Visualizer shows what changed. Consider CI/CD checks.

**Q: RLS policies—how critical?**
A: Very. Without proper RLS, users could access each other's data. Security issue.

---

**Created:** Feb 27, 2026  
**Status:** ⏳ PENDING IMPLEMENTATION  
**Estimated Total Effort:** 60-80 hours over 4-6 sprints

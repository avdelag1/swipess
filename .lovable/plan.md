

# Diagnosis: Two Critical Issues Blocking the App

## Root Cause 1: Wrong Backend Connection

The `src/integrations/supabase/client.ts` file (auto-generated) has hardcoded fallback values pointing to an **old** project (`vplgtcguxujxwrgguxqq`). The current Lovable Cloud project is `qegyisokrxdsszzswsqk`. The 404 error on `owner_client_preferences` confirms the app is talking to the wrong backend — the table exists in Lovable Cloud but not in the old project.

The env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) should override the fallbacks, but they are not being picked up — likely because the file was previously hand-modified (it has a custom `prodLogger` import and validation logic that the auto-generation system wouldn't produce), preventing automatic regeneration.

**Fix**: Since `client.ts` is already broken and was manually modified, we need to reset it to a clean auto-generated state with the correct Lovable Cloud credentials. This is the single most important fix.

## Root Cause 2: React Error #185 (Maximum update depth exceeded)

When every Supabase query returns 404 (wrong backend), error handlers fire, triggering toasts and state updates, which cause re-renders, which fire more queries — creating an infinite update loop. Additionally:

- **Duplicate toast renderers**: `App.tsx` renders both `<Toaster />` and `<Sonner />`, which are now the **same component** (since `toaster.tsx` re-exports from `sonner.tsx`). This means two identical Sonner instances both calling `useTheme()`.
- **Mixed toast systems**: `LegendaryLandingPage.tsx`, `TopBar.tsx`, and `DashboardLayout.tsx` import from the OLD `@/hooks/use-toast` (which has a global listener/dispatch pattern), while most other components use `@/components/ui/sonner`. The old system's `dispatch` triggers `setState` for all registered listeners.

## Implementation Plan

### Step 1: Fix `client.ts` — Correct backend connection
Write a clean `client.ts` that uses the correct Lovable Cloud project ID (`qegyisokrxdsszzswsqk`) and anon key as fallbacks, while keeping the `import.meta.env` overrides. Remove the custom `prodLogger` import (use standard console or no logging).

### Step 2: Remove duplicate Toaster in `App.tsx`
Remove one of the duplicate Sonner instances. Since `Toaster` from `toaster.tsx` now re-exports the same component as `Sonner` from `sonner.tsx`, we only need one.

### Step 3: Unify toast imports
Update `LegendaryLandingPage.tsx`, `TopBar.tsx`, and `DashboardLayout.tsx` to import `toast` from `@/components/ui/sonner` instead of `@/hooks/use-toast`. This eliminates the old global listener system that can cascade state updates.

### Step 4: Add defensive error handling
In the `useOwnerClientPreferences` hook and similar hooks that query the database, ensure 404 errors don't cascade into re-render loops by properly short-circuiting on errors.


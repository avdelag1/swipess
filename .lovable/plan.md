

# Plan: Full Backend Alignment + Build Error Fixes

## Directive (Locked In)

**Your real backend (`vplgtcguxujxwrgguxqq`) is the ONLY backend I will target.** Lovable Cloud (`qegyisokrxdsszzswsqk`) will not be touched unless you explicitly say so. Every table, edge function call, and connection in the codebase will point to your real project. The AI system will not be modified.

---

## Current State

The `client.ts` file already hardcodes your production project ID as the fallback, which means **when deployed to Vercel, everything already connects to your real backend**. In the Lovable preview, the `.env` is auto-managed and points to Cloud -- this cannot be changed (Lovable limitation), but the code is identical.

There are **no references** to the Lovable Cloud project ID (`qegyisokrxdsszzswsqk`) anywhere in the source code. The isolation is already clean.

## Build Errors to Fix

There are 7 missing modules causing build failures. None are AI-related.

### 1. Create missing filter components (3 files)
- `src/components/filters/PropertyClientFilters.tsx`
- `src/components/filters/MotoClientFilters.tsx`
- `src/components/filters/BicycleClientFilters.tsx`

These are imported by `AdvancedFiltersDialog.tsx`. I'll create them as simple filter form components matching the existing `WorkerClientFilters` pattern, with typed `onApply` callbacks (no `any` parameters).

### 2. Create missing page stubs (4 files)
- `src/pages/ClientProfileNew.tsx` — referenced by `PredictiveBundleLoader.tsx` for prefetching. Will re-export or redirect to existing `ClientProfile`.
- `src/pages/OwnerPropertyClientDiscovery.tsx` — referenced by `routePrefetcher.ts`. Will re-export `OwnerDiscovery` with property category preset.
- `src/pages/OwnerMotoClientDiscovery.tsx` — same pattern, moto category.
- `src/pages/OwnerBicycleClientDiscovery.tsx` — same pattern, bicycle category.

### 3. Create missing hook
- `src/hooks/useTokens.ts` — imported by `OwnerDiscovery.tsx`. Will create a simple hook that reads from `message_activations` table (which already exists in your DB).

### 4. Create missing page
- `src/pages/OwnerFilters.tsx` — referenced by `routePrefetcher.ts`. Will wrap `NewOwnerFilters` component which already exists.

### What I will NOT touch
- The AI system (orchestrator, concierge, sentient chat) -- per your instruction
- `src/integrations/supabase/client.ts` -- auto-generated, already correct
- `.env` -- auto-managed
- Any Lovable Cloud backend operations

## Technical Details

All new components will:
- Import from `@/integrations/supabase/client` (the existing client that already falls back to your real project)
- Follow existing TypeScript patterns, no `any` types on the filter callbacks
- Use existing UI primitives (Slider, Select, etc.) from the project's component library


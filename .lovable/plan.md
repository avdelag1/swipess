

# Make the App Feel Instant-Touch Everywhere

## Current State
The app already has solid foundations: `touch-action: manipulation` globally, `onPointerDown` on nav/header elements, CSS `:active` scale feedback, haptic helpers, and PWA-specific CSS optimizations.

## Remaining Gaps

### 1. Fix Build Errors (Prerequisite)
- **`ai-orchestrator/index.ts`**: Missing `zod` import and `serve` import from Deno
- **`SkinSwitcher.tsx`**: `haptics.impact('light')` should be `haptics.tap()`

### 2. Switch Remaining `onClick` Navigations to `onPointerDown`
Many interactive elements still use `onClick` for navigation, adding ~80-100ms delay on mobile. Key files:
- `ExploreFeatureLinks.tsx` — navigation buttons use `onClick`
- `LikedClients.tsx` — navigate button uses `onClick`
- Various card/list components that trigger route changes on `onClick`

**Fix**: For navigation-triggering buttons, fire `navigate()` on `onPointerDown` instead of `onClick`, matching the pattern already used in `TopBar`, `TinderTopNav`, and `BottomNavigation`.

### 3. Add Global CSS `:active` Instant Feedback for ALL Interactive Elements
Strengthen the existing `:active` styles to cover more element types and make them faster:
- Add `transition: transform 40ms` (currently 60ms) for tighter response
- Cover `a`, `label`, `[tabindex]` in addition to `button` and `[role="button"]`

### 4. Disable `startTransition` for Navigation
The `useAppNavigate` hook wraps navigation in `startTransition`, which deliberately deprioritizes the route change — this conflicts with instant feel. Per the project's own memory: "Navigation actions avoid the use of React.startTransition to ensure route changes are immediate."

**Fix**: Remove `startTransition` wrapping in `useAppNavigate.ts`, making `navigate()` calls synchronous/urgent.

### 5. Speed Up Page Transitions
`AnimatedOutlet.tsx` has a 280ms enter duration — trim to ~180ms for snappier feel. Exit is already fast at 160ms.

### 6. Add CSS `will-change: transform` on `:active` State Only
Rather than permanent `will-change` (wasteful), promote layers only during active press for jank-free scale feedback.

## Technical Details

| File | Change |
|------|--------|
| `supabase/functions/ai-orchestrator/index.ts` | Add `import { z } from "zod"` and `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"` |
| `src/components/SkinSwitcher.tsx` | Change `haptics.impact('light')` → `haptics.tap()` |
| `src/hooks/useAppNavigate.ts` | Remove `startTransition` wrapper, call `navigate()` directly |
| `src/components/AnimatedOutlet.tsx` | Reduce enter duration from 0.28s → 0.18s |
| `src/styles/pwa-performance.css` | Tighten `:active` timing to 40ms, add coverage for `a`, `[tabindex]` |
| `src/components/ExploreFeatureLinks.tsx` | Move navigation from `onClick` to `onPointerDown` |
| `src/components/LikedClients.tsx` | Move navigation from `onClick` to `onPointerDown` |

## Summary
These changes eliminate the last sources of perceived lag: deferred navigation via `startTransition`, `onClick` delays on remaining buttons, and slightly long page transition animations. Combined with the existing optimizations, every tap will feel physically immediate.


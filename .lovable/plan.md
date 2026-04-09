

## Plan: Error Cleanup, Dead Code Removal, and Polish

### Critical Fix: ModeSwitcher `useRef` Crash

The `ModeSwitcher.tsx` component imports `useRef` from React but never uses it. This unused import, combined with React's internal dispatcher resolution, is causing the crash: `Cannot read properties of null (reading 'useRef')`. The error triggers the `GlobalErrorBoundary` and causes the app to flash/recover visibly.

**Fix**: Remove the unused `useRef` import from `ModeSwitcher.tsx` line 1.

### Dead Code and Unused Import Cleanup

| File | Issue | Fix |
|------|-------|-----|
| `src/components/ModeSwitcher.tsx` | `useRef` imported but never used | Remove from import |
| `src/components/AppLayout.tsx` | `useRef` imported but never used | Remove from import |
| `src/components/AppLayout.tsx` | `modalStore` assigned on line 36 but never used (only `showAIChat` is destructured separately on line 69) | Remove line 36, keep the destructured usage |
| `src/index.css` | `card-breathe` keyframes + class defined but no component uses it anymore | Remove the dead CSS block |

### Tailwind Warning Cleanup

The dev server shows warnings about ambiguous Tailwind classes using bracket notation inside `data-[state=...]` selectors. These are in the `SentientHud` or similar component:
- `data-[state=closed]:duration-[160ms]`
- `data-[state=open]:duration-[220ms]`
- `duration-[220ms]`, `duration-[80ms]`
- `ease-[cubic-bezier(0.32,0.72,0,1)]`

**Fix**: Replace bracket-based `duration-[Xms]` with Tailwind's standard `duration-150`, `duration-200` equivalents, and use style props for the custom cubic-bezier easing.

### WelcomeBonusModal Placement

In `App.tsx` line 115, `<WelcomeBonusModal />` sits outside any `<Suspense>` boundary. If it triggers a lazy load or async state during render, it would cause a visible flash.

**Fix**: Wrap it inside the existing `<Suspense fallback={null}>` block on line 121.

### Summary

- 4 files modified for dead code removal
- 1 critical runtime error fixed (ModeSwitcher useRef crash)
- Tailwind warnings silenced
- WelcomeBonusModal wrapped in Suspense
- Zero architectural changes — pure cleanup


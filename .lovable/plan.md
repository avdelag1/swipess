

## Plan: Fix Radio Black Screen + Improve Category Card Loading

### Problem 1: Radio turns black on click

**Root cause**: The radio page has a loading overlay at `z-[10000]` with solid black background (lines 297-309). The `loading` state initializes as `true` and only turns `false` after `loadUserPreferences()` completes. When the component re-renders or when `AnimatePresence` exit animations don't complete cleanly, this black overlay can persist or flash back. Additionally, the auto-init `useEffect` (lines 245-259) runs with an empty dependency array and calls `togglePower()` + `play()`, which can trigger state churn that causes `loading` to flicker.

**Fix**:
- Remove the full-screen black loading overlay entirely — replace with a subtle inline spinner on the play button or station name area only. The radio should never go fully black.
- Guard the auto-init effect so it only fires once using a ref, preventing re-trigger on state changes.
- Ensure the main container always renders its content regardless of loading state.

### Problem 2: Category swipe cards load poorly

**Root cause**: Multiple issues compound:
1. **Duplicate CSS class**: `.swipe-card-size` is defined in both `index.css` and `premium-polish.css` with conflicting values, causing layout thrash.
2. **Heavy `AnimatePresence mode="popLayout"`** with spring physics on every card causes visible layout shifts during mount.
3. **`decoding="sync"`** on images blocks the main thread during initial render.
4. **Initial animation** (`initial={{ scale: 0.95, opacity: 0, y: 15 }}`) means every card fades in visibly, creating a "loading" feel.

**Fix**:
- Consolidate the `.swipe-card-size` CSS to a single definition.
- Remove `initial` animation on cards so they appear instantly on first render (use a `hasMounted` ref).
- Switch `decoding="sync"` to `decoding="async"` and rely on the preloader that already warms these images.
- Simplify `AnimatePresence` mode from `"popLayout"` to `"sync"` to reduce layout recalculations.
- Apply the same optimizations to the owner side (same `CategorySwipeStack` component handles both).

### Technical details

| Change | File |
|--------|------|
| Remove black loading overlay, add inline loading state | `src/pages/DJTurntableRadio.tsx` |
| Guard auto-init with ref to prevent re-triggers | `src/pages/DJTurntableRadio.tsx` |
| Consolidate `.swipe-card-size` (remove duplicate) | `src/styles/premium-polish.css` |
| Instant first render (skip initial animation) | `src/components/CategorySwipeStack.tsx` |
| Switch image decoding to async | `src/components/CategorySwipeStack.tsx` |
| Simplify AnimatePresence mode | `src/components/CategorySwipeStack.tsx` |

Both client and owner sides benefit from the `CategorySwipeStack` fix since it handles both roles.


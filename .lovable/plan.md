

# Fix Filter Page First-Tap Delay + Global App Responsiveness

## Root Cause: Filter Page "Doesn't Show Until Second Press"

The `AnimatedOutlet` uses `AnimatePresence mode="wait"` which **blocks the new page from mounting until the old page's exit animation finishes** (150ms). On mobile devices with complex pages (dashboard with swipe cards), this exit takes longer than expected, making it feel like the first tap did nothing. The user taps again, which by then the first navigation has completed.

## Fix 1: Make Route Transitions Instant

**File: `src/components/AnimatedOutlet.tsx`**
- Change `mode="wait"` to `mode="popLayout"` — this immediately mounts the new page and pops the old one out without blocking
- Remove the exit animation entirely (set to just `opacity: 0` with `duration: 0.08`) so old pages disappear instantly
- This is now safe because we previously removed all nested `AnimatePresence mode="popLayout"` from Likes pages — no more conflicts

## Fix 2: Reduce Motion Overhead on Page Enter

**File: `src/components/AnimatedOutlet.tsx`**
- Simplify the enter spring: reduce stiffness from 380→500, increase damping from 30→35, reduce mass from 0.6→0.5 for snappier settle
- Reduce initial x offset from 12→6 (less travel = faster perceived load)
- Keep `willChange: 'opacity'` for GPU acceleration

## Fix 3: Eliminate Filter Page Mount Delay

**File: `src/pages/ClientFilters.tsx`**
- The page reads `useClientFilterPreferences()` (a React Query hook) on mount. If the query is loading, the `useState` initializer may get empty values, then re-render when data arrives. Add `placeholderData` or use store values as defaults so the page renders immediately without waiting for DB.

**File: `src/pages/OwnerFilters.tsx`**
- Same: `useOwnerClientPreferences()` may cause a loading flash. Ensure store values are used as immediate defaults.

## Fix 4: Global Responsiveness — Remove Backdrop Blur on TopBar During Scroll

**File: `src/pages/ClientFilters.tsx`** (header)
- The sticky header uses `backdrop-blur-xl` which is expensive on mobile. Change to `backdrop-blur-md` (lighter) or use solid `bg-background/95` without blur for the filter page header specifically.

## Summary of Changes

| File | Change |
|------|--------|
| `AnimatedOutlet.tsx` | `mode="popLayout"`, faster enter spring, minimal exit |
| `ClientFilters.tsx` | Lighter header blur, stable initial state |
| `OwnerFilters.tsx` | Same header blur fix, stable initial state |

## Expected Result
- Filter page appears **instantly** on first tap (no second tap needed)
- All page transitions feel snappy and responsive
- No visual effects or designs removed — just faster execution
- Both client and owner filter pages load immediately


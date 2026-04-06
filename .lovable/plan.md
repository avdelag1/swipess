

# UI Polish: Unified Mode Switcher + Speed Fixes

## 1. Redesign ModeSwitcher as a dual-icon toggle button

**File:** `src/components/ModeSwitcher.tsx`

Replace the current `icon` variant with a compact dual-icon toggle pill:
- Two icons side by side in one button: `User` (client) and `Building2` (owner)
- No text labels — icons only
- The active icon gets the brand color (rose for client, orange for owner), inactive icon is dimmed
- Clicking toggles between modes — the color "slides" to the other icon
- Slightly larger pill (~40px tall, ~80px wide), thinner border, rounded-full
- Remove `ArrowLeftRight` icon and text labels
- Remove `AnimatePresence` animation overhead — use simple CSS transitions for the color swap (faster)

```text
┌──────────────┐
│  👤    🏢   │   ← Client active (👤 = rose, 🏢 = dimmed)
└──────────────┘

┌──────────────┐
│  👤    🏢   │   ← Owner active (👤 = dimmed, 🏢 = orange)
└──────────────┘
```

## 2. Speed up SwipessSwipeContainer

**File:** `src/components/SwipessSwipeContainer.tsx`

- Replace `AnimatePresence` around top controls overlay (lines 961-984) with a simple conditional render + CSS opacity transition — eliminates framer-motion mount/unmount overhead during deck transitions
- Reduce category-to-deck transition duration from 0.4s/0.5s to 0.25s/0.3s
- Remove `filter: 'blur(20px)'` from deck entry animation (GPU-expensive compositing)

## 3. Remove AnimatePresence from ModeSwitcher icon variant

Currently wraps icon swap in `AnimatePresence mode="popLayout"` with spring physics. Replace with a simple CSS `transition: color 150ms` on both icons — the active one changes color instantly, no React tree unmount/remount.

## 4. General speed audit

- The `useScrollBounce` hook in TopBar runs on every scroll event for a "bounce physics" effect on header buttons — evaluate if this is causing jank on scroll-heavy pages
- `motion.div` wrapper around category badge (line 992-1003) uses `initial/animate` — can be static CSS since it doesn't exit-animate

## Files Changed

| File | Change |
|------|--------|
| `src/components/ModeSwitcher.tsx` | Dual-icon toggle, no text, larger pill, CSS transitions |
| `src/components/SwipessSwipeContainer.tsx` | Remove blur transitions, reduce animation durations, simplify overlays |


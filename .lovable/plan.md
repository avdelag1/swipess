

## Plan: Instant Reactivity Everywhere + Remove Duplicate Distance Info

### What's Happening Now

**The "instant feel" on the bottom nav** comes from three things working together:
1. A global `useInstantReactivity` hook that adds a CSS active-state class + haptic on ANY button/link the instant you touch it (before React even processes the tap)
2. Framer Motion `whileTap={{ scale: 0.92 }}` with a stiff spring (stiffness: 1000, damping: 30)
3. Prefetching the next page on touch-start so the page is ready before you lift your finger

This system already covers ALL buttons and links app-wide via the global hook. The distance slider doesn't feel the same because it uses Framer Motion spring animations on the fill bar and thumb, which add latency. The slider also has `touchAction: 'none'` which is correct for dragging but the spring physics delay the visual response.

**The duplicate info**: The exhausted state has a "Coverage / Search Radius" header with km badge + Auto button (lines 218-243), AND the `SwipeDistanceSlider` component renders its OWN "Radar Radius / Scanning Range" header with ANOTHER km badge + Auto button. Two headers, two km displays, two Auto buttons.

### Changes

#### 1. Strip SwipeDistanceSlider to Slider-Only (`SwipeDistanceSlider.tsx`)
- Remove the entire internal header (MapPin icon, "Radar Radius", "Scanning Range", km display, Auto button) — lines 47-81
- Remove the "1 KM / 100 KM+" footer labels (lines 126-129) since the parent already has these
- Remove the dark card wrapper (`bg-black/40`, border, shadow) — the parent provides its own card
- Keep ONLY the slider track, invisible range input, and animated thumb
- Remove the spring animation on the fill bar — use direct `style.width` percentage for instant response (no spring delay)
- The thumb position updates via direct MotionValue transforms (already instant)

#### 2. Make Slider Feel Instant (`SwipeDistanceSlider.tsx`)
- Replace `useSpring` (stiffness: 450, damping: 32) with direct `useMotionValue` for the fill width — zero lag between finger movement and visual update
- Keep the thumb's `useTransform` mapping but remove the spring intermediary so it tracks the native input 1:1
- This matches the "zero-animation" principle already used on the bottom nav buttons

#### 3. Adjust Parent Layout (`SwipeExhaustedState.tsx`)
- Keep the existing "Coverage / Search Radius" header with km badge + Auto button (lines 218-243) as the single source of truth
- The `SwipeDistanceSlider` now renders just the track bar directly below this header
- Add the "Local / 100 km+" scale labels below the slider (move from SwipeDistanceSlider to here)
- Tighten vertical spacing since we removed a full duplicate header block — this frees up ~60px of vertical space, making the distance card more compact and ensuring it fits on screen

### Files Modified
1. `src/components/swipe/SwipeDistanceSlider.tsx` — Strip to slider-only, remove spring delay
2. `src/components/swipe/SwipeExhaustedState.tsx` — Add scale labels, tighten spacing

### What Stays the Same
- The global `useInstantReactivity` hook already provides instant feedback on all buttons/links across the entire app
- The bottom nav's tap spring, haptics, and prefetch logic remain untouched
- Radar scan burst behavior (6-second timer on refresh) stays as-is
- All swipe/like persistence logic unchanged


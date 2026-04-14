

## Softer, More Fluid Swipe Physics Across All Card Types

### Problem
The swipe cards feel "heavy" -- low `dragElastic`, high `stiffness`, high thresholds make the drag resist the finger. The Advertise page cards also have inconsistent physics. All swipe surfaces need a unified, silky feel.

### Changes

**1. PokerCategoryCard.tsx (Category selector cards -- Client & Owner dashboards)**
- `dragElastic`: 0.18 -> 0.65 (finger tracks more loosely, feels lighter)
- Swipe trigger threshold: `dist > 60` -> `dist > 40`, `vel > 350` -> `vel > 250`
- Exit spring: stiffness 800/damping 35 -> 500/28 (smoother exit arc)
- Snap-back spring: stiffness 600/damping 25 -> 350/22 (softer bounce back)

**2. SimpleSwipeCard.tsx (Client discovery deck)**
- `dragElastic`: 0.15 -> 0.55 (dramatic improvement in finger-follow feel)
- `SWIPE_THRESHOLD`: 100 -> 65
- `VELOCITY_THRESHOLD`: 400 -> 280
- Switch `ACTIVE_SPRING` from `NATIVE` (800/22/0.1) to a new `SILK` config: stiffness 400, damping 24, mass 0.3 -- responsive but graceful
- `MAX_ROTATION`: 28 -> 18 (less dramatic, more elegant)

**3. SimpleOwnerSwipeCard.tsx (Owner discovery deck)**
- `dragElastic` is already 0.9 (good), keep it
- Match spring physics to the new `SILK` config (stiffness 400, damping 24)
- Ensure snap-back uses same soft spring

**4. CategorySwipeStack.tsx (Quick filter cards)**
- `dragElastic`: 0.12 -> 0.55
- `dragConstraints`: widen from `left: -150, right: 150` to `left: -200, right: 200`
- Drag spring during drag: stiffness 800 -> 400, damping 35 -> 24
- Swipe threshold: `info.offset.x > 80` -> `> 50`

**5. AdvertisePage.tsx (Promote page swipe cards)**
- `dragElastic`: 0.9 -> 0.6 (currently too loose, cards fly away)
- Add `dragMomentum={false}` for controlled feel
- Swipe dismiss threshold: `Math.abs(info.offset.x) > 100` -> `> 60`
- Add snap-back animation when below threshold instead of just releasing
- Add `rotate` transform matching the other cards for consistency

### Unified "SILK" Spring Config
All swipe cards will converge on this physics profile:
```text
SILK: { stiffness: 400, damping: 24, mass: 0.3 }
```
This gives an iOS-native feel: responsive without being stiff, with a slight organic settle.

### Files Modified
- `src/components/swipe/PokerCategoryCard.tsx`
- `src/components/SimpleSwipeCard.tsx`
- `src/components/SimpleOwnerSwipeCard.tsx`
- `src/components/CategorySwipeStack.tsx`
- `src/pages/AdvertisePage.tsx`




## Stabilization & Polish Plan

### Issues Identified

1. **Token badge uses Zap (lightning) icon** — conflicts with lightning already used elsewhere on the owner dashboard. User wants a dedicated token/coin icon instead, with no number displayed.
2. **Owner dashboard content sits too low** — the `EnhancedOwnerDashboard` root div has `overflow-y-auto` and the `OwnerAllDashboard` fan view wrapper uses `h-full` but `isImmersiveDashboard` sets `paddingBottom: 0` while `paddingTop` adds ~60px+safe-area, pushing content down and making the bottom overlap the nav bar.
3. **No card parallax/tilt effect** — no gyroscope/deviceorientation code exists. Need to add a subtle iOS-style parallax tilt to swipe cards based on device motion.
4. **Radio UI needs iOS-native polish** — the current layout has controls pushed to `mb-10` which can overlap or feel cramped on shorter devices; safe-area padding needs tightening; overall spacing needs to feel more like Apple Music.

---

### Plan

#### 1. Fix token badge in TopBar
- Replace `Zap` icon with `Coins` from lucide-react (a round coin stack icon — distinct from lightning).
- Remove the numeric `{tokens}` text. Show only the icon as a tappable pill.
- Keep the tap-to-open-TokensModal behavior.

#### 2. Fix owner dashboard vertical centering
- In `EnhancedOwnerDashboard.tsx`, remove `overflow-y-auto` from the root wrapper for the fan/card views — the parent `#dashboard-scroll-container` already handles scrolling.
- In `DashboardLayout.tsx`, for `isImmersiveDashboard` routes, set `paddingBottom` to `calc(var(--bottom-nav-height) + var(--safe-bottom))` instead of `0px` — this prevents the fan cards from sinking behind the bottom nav.
- Keep `paddingBottom: 0` only for true fullscreen routes (radio, camera).

#### 3. Add subtle iOS parallax tilt to swipe cards
- Create a new hook `useDeviceParallax()` that listens to `deviceorientation` events (with permission request on iOS 13+).
- Returns `{ tiltX, tiltY }` as motion values (clamped ±8deg).
- In `SimpleOwnerSwipeCard`, apply a subtle `rotateX/rotateY` transform on the card image layer using these values, with `perspective(800px)`.
- Smooth the values with a low-pass filter (lerp ~0.1) for a buttery feel.
- Only active on the top card (`isTop`).

#### 4. Polish radio UI for iOS
- Adjust the radio page (`DJTurntableRadio.tsx`) layout:
  - Top bar: use `pt-[calc(env(safe-area-inset-top,16px)+8px)]` for consistent safe-area clearance.
  - Controls section: change `mb-10` to `mb-[calc(env(safe-area-inset-bottom,20px)+16px)]` so the volume bar and buttons clear the home indicator on all devices.
  - Turntable: reduce max size from `min(85vw, 38dvh)` to `min(75vw, 32dvh)` to give more room to controls on shorter phones.
  - Station name: reduce from `text-4xl sm:text-5xl` to `text-2xl sm:text-3xl` to prevent crowding.
  - Remove the orange-tinted hexagonal scan-line effect on the stations button (too "tech-demo-ish") — use a clean rounded glass button instead.
  - Reduce heart/favorites button size from `w-16 h-16` to `w-12 h-12` for balance.
  - Tighten gap between controls from `gap-6` to `gap-4`.

#### 5. Build verification
- Run full TypeScript build to catch any regressions.

---

### Files to modify
- `src/components/TopBar.tsx` — token icon swap, remove number
- `src/components/DashboardLayout.tsx` — fix paddingBottom for immersive dashboards
- `src/components/EnhancedOwnerDashboard.tsx` — remove inner overflow-y-auto
- `src/components/SimpleOwnerSwipeCard.tsx` — integrate parallax tilt
- `src/hooks/useDeviceParallax.ts` — new hook (deviceorientation listener)
- `src/pages/DJTurntableRadio.tsx` — iOS spacing + design tightening


## Goal

Three things, no scope creep:

1. Owner side must load again (currently white-screens / boundary error).
2. The owner poker-card deck and the quick-filter row must sit centered within the safe area between the TopBar and BottomNav on a 393×779 viewport.
3. No extra background frames around cards or filter rails. The TopBar pill, mode-switcher pill, bottom-nav pill, and notification circle stay exactly as they are.

## Findings

- Console shows React **error #426** (a Suspense boundary received an update before it finished hydrating). On the Owner route this fires through `EnhancedOwnerDashboard → OwnerAllDashboard`, which lazy-resolves modal/route state inside its render path and reads `useModalStore.getState()` from inside a click handler created during the same Suspense pass.
- `OwnerAllDashboard` sizes the deck with `height: min(75svh, 600px)`. With `--top-bar-height` + `--safe-top` + `--bottom-nav-height` + `--safe-bottom` already eating ~150–170px on a 779-tall device, 75svh = ~584px overflows the parent flex container, so the deck visually pushes under the bottom nav and the quick-filter row gets clipped.
- `EnhancedOwnerDashboard` wraps the deck in two stacked centering layers (`flex flex-col items-center` + `flex flex-col justify-center`) which together with the loader/skeleton block create an extra translucent panel behind the cards.
- `OwnerKilometerView` adds a `rounded-[3.5rem] border ... backdrop-blur-xl` panel — that is the extra "frame background" the user is calling out on the owner side.
- `OwnerClientSwipeDialog` still passes `onClientTap` correctly; no schema mismatch there.

## Plan

### 1. Fix owner-side crash (React #426)

Edit `src/pages/EnhancedOwnerDashboard.tsx`:
- Wrap the `<AnimatePresence>` body in a single `<Suspense fallback={null}>` so Framer Motion's deferred children cannot bubble a suspending update past the route boundary.
- Remove the `typeof document !== 'undefined' && document.body && (...)` guard around `<SwipeInsightsModal>` — it forces the modal to mount/unmount on every render and is part of what triggers the boundary update; render the modal unconditionally with its own `open` prop.

Edit `src/components/swipe/OwnerAllDashboard.tsx`:
- Move the `useModalStore.getState()` lookup out of the inline `handleSelect` closure into a top-level `const openAIListing = useModalStore(s => s.openAIListing)` so the click path is pure and stable.
- Keep the existing image preload effect (already safe).

### 2. Center the owner deck in the safe viewport

Edit `src/pages/EnhancedOwnerDashboard.tsx` (cards phase only):
- Replace the deck wrapper sizing with a true safe-area calculation:
  - parent: `flex-1 min-h-0` (already there) and remove the inner duplicate `flex flex-col justify-center` wrapper.
  - the motion container keeps `paddingTop: calc(var(--top-bar-height) + var(--safe-top))` and `paddingBottom: calc(var(--bottom-nav-height) + var(--safe-bottom) + 16px)`.

Edit `src/components/swipe/OwnerAllDashboard.tsx`:
- Replace the hard `height: min(75svh, 600px)` with a container-relative size:
  - `height: min(100%, 600px)` on the deck stage,
  - `width: calc(min(100%, 600px) * ${PK_ASPECT})`,
  - keep `aspect-ratio` as fallback for older WebKit.
- Remove `min-height: auto` inline style (redundant).

This makes the deck consume only the height actually available between TopBar and BottomNav, so it's mathematically centered on every device including 393×779.

### 3. Strip extra frames, preserve existing button pills

Edit `src/pages/EnhancedOwnerDashboard.tsx`:
- Drop the loader's `bg-white/5 rounded-3xl` skeleton blocks; keep the spinner only (no panel chrome behind it).
- Remove the `OwnerKilometerView` outer `rounded-[3.5rem] border bg-white/80|bg-black/60 backdrop-blur-*` panel. Keep the slider, the radius readout, and the buttons exactly as they are — they already carry their own surfaces.
- Remove the absolute `Swipess FLAGSHIP v1.0.97` watermark (visual noise the user did not ask for).

Edit `src/components/swipe/SwipeExhaustedState.tsx`:
- Confirm the quick-filter row has no wrapper card; if a `bg-*/border-*/backdrop-blur-*` parent is present around the category grid + filter button, remove it. Buttons retain their per-button glass pill (already implemented in the previous turn).

Do **not** touch:
- `TopBar.tsx`, `ModeSwitcher.tsx`, `BottomNavigation.tsx`, `NotificationPopover.tsx` — user explicitly likes the current pill/circle treatment.
- Swipe physics, `SimpleOwnerSwipeCard`, or any routing.

## Files to edit

```
src/pages/EnhancedOwnerDashboard.tsx
src/components/swipe/OwnerAllDashboard.tsx
src/components/swipe/SwipeExhaustedState.tsx
```

## Verification

- `npx tsc --noEmit` → 0 errors.
- Manual: `/owner/dashboard` renders the fanned poker deck centered with no console error #426; quick-filter row sits within the safe area; no halo panel behind the slider on the kilometer step; TopBar / BottomNav pills unchanged.

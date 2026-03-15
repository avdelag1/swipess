

## Plan: Disable Tap Sounds on Sign In/Up Screen

### Problem
The `LandingBackgroundEffects` component renders behind both the landing view AND the auth (sign in/sign up) view. Its `handleCanvasPointerDown` plays zen/jungle sounds on every tap regardless of which view is active.

### Fix (1 file)

**`src/components/LegendaryLandingPage.tsx`**
- Pass the current `view` state to `LandingBackgroundEffects` as a new `disableSounds` prop: `disableSounds={view === 'auth'}`

**`src/components/LandingBackgroundEffects.tsx`**
- Accept `disableSounds?: boolean` prop
- Guard the sound playback in `handleCanvasPointerDown` — skip `playRandomZen` and `playJungleSound` calls when `disableSounds` is true
- Visual effects (particles, ripples, cloud puffs) continue working normally on both screens

This is a 2-file, ~5-line change.


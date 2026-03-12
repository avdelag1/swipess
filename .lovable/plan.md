

# Landing Page: Singing Bowl Sounds + Cheetah Print Theme

## What Changes

### 1. Add Singing Bowl Sounds on Tap (Stars & Orbs modes)
- When tapping the background on stars mode (shooting star spawn) or orbs mode, play a random singing bowl / meditation bell sound from the existing zen sound pool (`bells-2-31725.mp3`, `bell-a-99888.mp3`, `deep-meditation-bell-hit-heart-chakra-4-186970.mp3`, `deep-meditation-bell-hit-third-eye-chakra-6-186972.mp3`, `large-gong-2-232438.mp3`)
- Reuse the existing `playRandomZen()` function from `src/utils/sounds.ts` — it already picks randomly from these files
- In `LandingBackgroundEffects.tsx`, call `playRandomZen(0.3)` inside the `handlePointerDown` for both `stars` and `orbs` modes

### 2. Replace "Off/Dark" Mode with Cheetah Print Theme
- Change `EffectMode` from `'off' | 'stars' | 'orbs'` to `'cheetah' | 'stars' | 'orbs'`
- Copy the two uploaded cheetah images to `public/images/cheetah-1.jpeg` and `public/images/cheetah-2.jpeg`
- New `cheetah` mode renders:
  - Full-screen cheetah print background image (cover, centered)
  - A slow CSS "breathing" animation: gentle scale pulse (1.0 → 1.03 → 1.0) over ~4 seconds, creating a living/breathing effect
  - On tap: canvas-based fur ripple effect — a radial displacement wave emanates from the tap point, distorting the image briefly as if the fur is moving/alive. Uses a secondary canvas overlay with `drawImage` + pixel displacement math
- Update cycle: `stars → orbs → cheetah → stars`
- Update label: cheetah mode shows `🐆`

### 3. Tap Fur Ripple Effect (Cheetah Mode)
- When user taps in cheetah mode, spawn a ripple at tap coordinates
- The ripple is a circular wave that expands outward, displacing pixels radially for ~600ms
- Multiple taps create multiple independent ripples
- This creates the illusion of "touching living fur" — the skin moves where you touch it
- Implementation: load cheetah image into an offscreen canvas, on each frame apply displacement from active ripples, render to visible canvas

### Files Modified

| File | Change |
|------|--------|
| `public/images/cheetah-1.jpeg` | Copy uploaded image |
| `public/images/cheetah-2.jpeg` | Copy uploaded image |
| `src/components/LandingBackgroundEffects.tsx` | Add `cheetah` mode with breathing + tap ripple, add bowl sounds on tap for all modes |
| `src/components/LegendaryLandingPage.tsx` | Update `EffectMode` type, cycle order, label for cheetah |

### Technical Notes
- The ripple displacement uses sine-wave math: for each pixel within ripple radius, offset it radially based on `sin(distance - time)` — computationally light for a single full-screen pass
- Breathing animation uses CSS `@keyframes` scale on the image container, not canvas, for GPU efficiency
- Bowl sounds use low volume (0.3) so they feel ambient, not intrusive
- `pointer-events: auto` needed on the cheetah canvas to capture taps (other modes use window-level listeners already)


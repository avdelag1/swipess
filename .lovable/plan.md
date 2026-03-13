

# Fix Background Effects: Sounds, Beach Theme Visibility, Interactions

## Problems Identified

1. **Sunset/beach theme is invisible** — Currently draws a near-white canvas with opacity 0.12-0.18 gradients, which is essentially invisible. No actual beach image is used.
2. **Tap sounds may not trigger** — Browser autoplay policy can block audio on first interaction. The canvas `pointerdown` handler is correctly scoped but sounds may silently fail.
3. **Jungle purr MP3 files may be empty/corrupt** — They were created as binary placeholders and might not contain valid audio data.

## Plan

### 1. Make Beach/Sunset Theme Visible
- Copy the uploaded beach sunset image (`image-71.jpg`) to `public/images/beach-sunset.jpg`
- In `drawSunset()`, load and render the beach sunset image as the full background (like cheetah mode does with its image)
- Preload the beach image in a `useEffect` (same pattern as `cheetahImgRef`)
- Keep the cloud puff tap effects on top of the beach image
- Add a subtle warm overlay for depth consistency

### 2. Fix Sound Playback
- The sound functions use `new Audio()` each tap — this works but can fail silently on mobile due to autoplay restrictions
- Add a small "unlock audio" step: on first user interaction with the canvas, create and play a silent audio context to unlock the browser's audio gate
- This ensures subsequent `playRandomZen()` and `playJungleSound()` calls succeed

### 3. Fix Jungle Purr Sounds
- The jungle-purr MP3 files are likely invalid binaries. Since we can't generate real audio files, change the cheetah mode to reuse existing valid sounds from the zen pool but played at different pitch/speed to sound exotic
- OR: use the existing meditation bell sounds for cheetah mode as well (they work), and just play them at lower volume with a different character

**Practical fix**: Have `playJungleSound()` reuse the existing working sound files (gong, bells) since the generated MP3s are likely corrupt. Play them with slightly different volume/selection to differentiate.

### 4. Ensure All Interactions Work
- **Stars**: Shooting stars spawn on tap — already working in code
- **Orbs**: Follow finger via `pointermove` — already working  
- **Cheetah**: Breathing + ripple on tap — already working
- **Sunset**: Cloud puffs on tap — code works, just need visible background

### Files Modified

| File | Change |
|------|--------|
| `public/images/beach-sunset.jpg` | Copy uploaded beach sunset image |
| `src/components/LandingBackgroundEffects.tsx` | Load beach image for sunset mode, add audio unlock, preload beach image |
| `src/utils/sounds.ts` | Fix `playJungleSound` to use valid existing sound files |


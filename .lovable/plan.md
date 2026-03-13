

# Landing Page Overhaul: New Image, Beach Theme, Sound Fixes, Auth Backgrounds

## Summary of All Changes

This is a large update touching the landing background system, sounds, and auth screens. Here's everything:

---

### 1. Replace Animal Print Image
- Copy uploaded `images_24-2.jpeg` to `public/images/cheetah-1.jpeg` (overwrite) — clean image without branding/watermark
- The current `cheetah-1.jpeg` may have artifacts; the user's uploaded image is a clean leopard fur texture

### 2. Fix Double Sound on Tap
**Problem**: `handlePointerDown` on `window` fires for ALL taps (including UI buttons, logo drag, etc.), and cheetah mode plays `playRandomZen` which can overlap with other handlers.

**Fix in `LandingBackgroundEffects.tsx`**:
- Instead of `window.addEventListener('pointerdown')`, attach the listener to the **canvas element itself** with `pointer-events: auto` (currently set to `none`)
- This ensures sounds ONLY trigger when tapping the background canvas, not when tapping buttons/forms
- Canvas gets `pointer-events: auto` style, but keep `z-0` so it stays behind UI
- Single sound per tap guaranteed since there's only one listener on the canvas

### 3. Animal Print Sounds → Jungle/Jaguar Purr
- No jungle sounds exist in `/public/sounds/`. Need to source/create them.
- Add 3-4 short jaguar purr/growl sounds (soft, not scary) to `public/sounds/`:
  - `jaguar-purr-1.mp3`, `jaguar-purr-2.mp3`, `jaguar-purr-3.mp3`
- Create a `playJungleSound()` function in `sounds.ts` that picks randomly from this pool
- In `LandingBackgroundEffects.tsx`, cheetah mode calls `playJungleSound(0.3)` instead of `playRandomZen(0.3)`
- Stars/Orbs keep `playRandomZen` (singing bowls)

### 4. Replace Cheetah Toggle Icon
- Current icon: `🐆` emoji
- Replace with a pattern-like icon. Use `◆` or a small SVG/text that looks like animal print spots
- Simple change: replace `'🐆'` with something like `'🔶'` or better, render a tiny leopard-spot SVG inline

### 5. New Background Mode: "Cloud Puff Sunset" 🌅
Add a 4th effect mode to the cycle: `stars → orbs → cheetah → sunset → stars`

**`EffectMode`** becomes `'cheetah' | 'stars' | 'orbs' | 'sunset'`

**Sunset mode rendering** (canvas-based):
- **Base**: Soft white background with animated gradient overlay using warm sunset tones (coral, golden yellow, peach, light pink) at very low opacity (~0.15-0.25), slowly shifting via sine waves over 20+ seconds
- **Tap interaction**: Spawn a "cloud puff" particle system at tap location:
  - Draw a cluster of overlapping soft white circles (fluffy cloud shape)
  - Cloud expands from small to ~60px over 400ms
  - Then breaks into 8-12 tiny mist particles that float upward and fade over 800ms
  - Total lifetime: ~1.2 seconds
  - Soft glow from sunset gradient behind cloud
- **Rare effects** (5% chance per tap): subtle mini rainbow arc or sun ray shimmer from tap point
- **Sound**: Use existing zen/bell sounds (calming fits the beach theme)
- **Icon**: `☁️` or `🌅`

### 6. Auth Screens Show Active Background Effect
**Current**: Auth view always shows `'cheetah'` mode (line 550: `mode={view === 'auth' ? 'cheetah' : effectMode}`)

**Fix**: Pass `effectMode` directly regardless of view:
```
<LandingBackgroundEffects mode={effectMode} />
```
This way if user selected stars, orbs, cheetah, or sunset on landing, it persists into auth.

### 7. Ensure Text Readability on Auth with All Backgrounds
- The auth card already has `bg-card border border-border` styling which provides solid contrast
- For sunset mode (lighter background), ensure the auth page base div gets a subtle dark overlay so text remains readable
- Add a conditional semi-transparent overlay behind auth content when mode is `'sunset'`

---

## Files Modified

| File | Change |
|------|--------|
| `public/images/cheetah-1.jpeg` | Replace with clean uploaded image |
| `public/sounds/jaguar-purr-*.mp3` | Add 3 soft jaguar purr sounds |
| `src/utils/sounds.ts` | Add `jungleSoundPool` + `playJungleSound()` |
| `src/components/LandingBackgroundEffects.tsx` | Fix pointer events to canvas only, add sunset mode drawing, change cheetah sound to jungle, add cloud puff system |
| `src/components/LegendaryLandingPage.tsx` | Add `'sunset'` to EffectMode, update cycle, fix auth background to use active mode, update icons |

## Performance Notes
- Cloud puff uses simple circle particles (no image loading), very lightweight
- Sunset gradient is just 2-3 `fillRect` calls with low-opacity gradients
- Canvas pointer events scoped to canvas element prevents bubbling issues


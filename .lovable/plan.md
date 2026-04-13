

# Radio Redesign — Clean FM Tuner Interface

## What We're Building

A minimal, Apple-inspired FM radio interface replacing the current turntable/vinyl design. The centerpiece is a **horizontal frequency band** that responds to finger swipe/drag to change stations — like spinning a physical tuning wheel. Large frequency numbers dominate the screen, with clean circular playback controls at the bottom.

## Reference Analysis

From your image: clean white/light background, massive "99.2 FM" typography centered, a horizontal frequency ruler with a red indicator line, neumorphic circular buttons (back, play/pause, forward), plus small accent buttons (heart/favorite, settings/gear, share, save).

## Plan

### 1. Rewrite DJTurntableRadio.tsx — New FM Tuner UI

Remove all turntable/vinyl/stars canvas code. Replace with:

- **Large frequency display**: Massive serif/display font showing "99.2" + "FM" below it, animated on station change
- **Horizontal frequency band**: A draggable ruler showing tick marks from 88–108 MHz with a fixed red center indicator line. Touch/drag scrolls the ruler left-right, snapping to station frequencies. Each snap triggers haptic feedback and station change
- **Circular playback controls**: Three large neumorphic circles at the bottom — skip back, play/pause (largest), skip forward — matching the reference style
- **Accent buttons**: Heart (favorite) and settings (station list drawer) as smaller circular buttons positioned like the reference
- **Back arrow**: Top-left chevron to navigate back

### 2. Create FrequencyBand Component

New `src/components/radio/FrequencyBand.tsx`:

- Renders a horizontal ruler with major/minor tick marks spanning the FM range
- Uses touch events (touchstart/touchmove/touchend) + mouse drag for desktop
- Translates finger movement into frequency band scrolling with momentum/inertia
- Fixed red indicator line at center; the band moves behind it
- Snaps to nearest station frequency on release
- Haptic tick feedback as each station mark passes the indicator
- Smooth spring animation for snap-to-station

### 3. Adapt Light/Dark Theme Support

- Light mode (default): white background, dark text, subtle shadows on buttons (neumorphic)
- Dark mode: inverted — dark background, white text, glass buttons
- Red accent for the frequency indicator line in both modes

### 4. Clean Up Skin System

- Remove `RadioSkin` type entirely from `src/types/radio.ts` — no more skin switching
- Remove `setSkin` from RadioContext
- Remove `skin` from `RadioPlayerState`
- Delete `src/components/radio/FrequencyDial.tsx` (old arc dial — replaced)
- Keep `StationDrawer` (still useful for browsing all stations)

### 5. Files Modified/Created

| File | Action |
|---|---|
| `src/pages/DJTurntableRadio.tsx` | Full rewrite — clean FM tuner |
| `src/components/radio/FrequencyBand.tsx` | New — touch-draggable frequency ruler |
| `src/components/radio/FrequencyDial.tsx` | Delete |
| `src/components/radio/PlayerControls.tsx` | Delete (controls inline in new design) |
| `src/types/radio.ts` | Remove `RadioSkin`, remove `skin` from state |
| `src/contexts/RadioContext.tsx` | Remove `setSkin`, remove `skin` from state/persistence |

### 6. Interaction Details

- **Finger drag on frequency band**: Velocity-based scrolling with deceleration. As the band moves, when a station frequency crosses the red indicator, a light haptic fires. On finger release, spring-snaps to nearest station and plays it
- **Buttons**: `scale(0.94)` on press with 40ms transition, neumorphic shadow style matching the reference image
- **Station change**: Frequency number animates with a quick fade-scale transition


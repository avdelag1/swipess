

## Plan: Professional DJ Turntable Radio Skin

### What We're Building
A new full-screen DJ turntable radio page rendered entirely with CSS/SVG (no external images needed). It will replace the cassette player as the default skin shown when navigating to `/radio`.

### Visual Design
```text
┌─────────────────────────────────────┐
│  [←]          CITY NAME    [♡][☰]  │  ← floating chrome buttons
│                                     │
│         ┌─────────────────┐         │
│         │   ╭───────────╮ │         │  ← platter (metallic ring)
│         │   │  VINYL    │ │         │
│         │   │  record   │ │         │  ← spinning vinyl with grooves
│         │   │  (label)  │ │         │     + center label (station name)
│         │   ╰───────────╯ │         │
│         └─────────────────┘         │
│              ╲  tonearm             │  ← SVG tonearm, rotates onto vinyl
│                                     │
│  ┌──┐  [⏮] [▶/⏸] [⏭]  ┌────────┐ │
│  │  │                     │ PITCH  │ │  ← vertical pitch fader = volume
│  │  │   Station · Genre   │ FADER  │ │
│  └──┘                     └────────┘ │
└─────────────────────────────────────┘
```

### Key Features
1. **Spinning vinyl record** — CSS animation (`rotate 360deg`, 1.8s per revolution). Spins when playing, stops when paused. Grooves rendered as concentric semi-transparent rings. Center label shows station name + city in retro typography.
2. **Metallic platter** — radial gradient simulating brushed aluminum.
3. **Tonearm** — SVG arm that rotates from rest position onto the record when playing (framer-motion `rotate` animation).
4. **Pitch fader** — vertical slider mapped to `setVolume(0-1)`. Styled as a professional DJ pitch slider with center detent marking.
5. **Transport controls** — Play/Pause, Prev, Next buttons styled as tactile DJ deck buttons with neon glow feedback.
6. **Station info** — current station name, genre, frequency displayed below the platter.
7. **Floating chrome** — Back, Favorites, Browse Stations, Shuffle buttons (same pattern as cassette page).
8. **Station Drawer** — reuses existing `StationDrawer` component.
9. **City theme colors** — vinyl label and glow effects adapt to city theme.

### Implementation

**New file: `src/pages/DJTurntableRadio.tsx`**
- Full-screen page (~400 lines), same structure as `RetroRadioStation.tsx`
- Uses `useRadio()` for all state/controls
- CSS-only vinyl with `@keyframes spin` (paused/running based on `isPlaying`)
- SVG tonearm with framer-motion rotation
- Custom vertical pitch fader (styled `<input type="range">` rotated 270deg or custom div)
- Reuses `StationDrawer` for station browsing
- Keyboard shortcuts (space, arrows) same as cassette page

**Modified: `src/App.tsx`**
- Change `/radio` route to render `DJTurntableRadio` instead of `RetroRadioStation`
- Keep cassette available at `/radio/cassette` for users who want to switch

**Modified: `src/types/radio.ts`**
- Add `'turntable'` to `RadioSkin` type

**Modified: `src/contexts/RadioContext.tsx`**
- Change default skin from `'retro'` to `'turntable'`

### Files

| File | Change |
|------|--------|
| `src/pages/DJTurntableRadio.tsx` | **New** — full turntable UI page |
| `src/App.tsx` | Route `/radio` → `DJTurntableRadio`, add `/radio/cassette` |
| `src/types/radio.ts` | Add `'turntable'` to `RadioSkin` |
| `src/contexts/RadioContext.tsx` | Default skin → `'turntable'` |


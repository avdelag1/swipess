

## Plan: HD Visual Quality Uplift — Brighter Colors, Tactile Buttons, Deeper Surfaces

The goal: make every element feel **physically present** — brighter accent colors, buttons that look like you could touch them, and surfaces with real depth separation. No layout or logic changes.

---

### 1. Boost Primary & Accent Color Vibrancy Across All Themes

**File**: `src/styles/matte-themes.css`

The primary color in several themes is a flat, desaturated HSL that doesn't pop. Upgrade to the brand orange (`18 100% 50%` = #FF4D00) where appropriate, and increase lightness on accent colors by 5-8% for more "glow."

| Theme | Current `--primary` | New `--primary` |
|-------|-------------------|-----------------|
| grey-matte | `0 100% 50%` (flat red) | `18 100% 50%` (brand orange) |
| black-matte | `343 99% 62%` (pink) | `343 99% 65%` (brighter pink) |
| pure-black | `0 100% 58%` | `18 100% 55%` (warm orange) |
| light | `343 99% 62%` | `343 99% 65%` |

Also bump `--accent`, `--accent-primary`, `--ring` to match in each theme. Increase `--muted-foreground` lightness by ~5% in dark themes so secondary text is more readable.

### 2. Add Physical Depth to Primary Buttons

**File**: `src/components/ui/button.tsx`

The `default` and `premium` button variants currently use flat `bg-primary`. Add:
- An **inner highlight** (`inset 0 1px 0 rgba(255,255,255,0.2)`) for a "lit from above" effect
- A **cinematic drop shadow** using the brand color (`0 4px 14px rgba(255,77,0,0.35)`)
- A subtle **top-to-bottom gradient** overlay via a pseudo-element (brighter at top, standard at bottom)

This makes buttons look physically raised and "pressable" — like real objects.

Changes to `buttonVariants` CVA:
```
default: 'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_14px_rgba(255,77,0,0.3)]'
premium: same treatment
gradient: add the brand gradient with inner highlight
```

### 3. Increase Surface Depth Separation

**File**: `src/styles/matte-themes.css`

Card backgrounds are too close to base backgrounds (e.g., grey-matte: bg 18% vs card 23% — only 5% difference). Widen the gap:
- grey-matte: `--card` from `0 0% 23%` → `0 0% 25%`
- black-matte: `--card` from `0 0% 5%` → `0 0% 7%`
- Increase `--secondary` lightness by 2-3% in each dark theme

This creates more visible "layers" — surfaces feel stacked and dimensional.

### 4. Enhance Icon & Text Luminance

**File**: `src/styles/matte-themes.css`

Bump `--muted-foreground` from ~70-72% to ~78% in dark themes. This ensures secondary labels, timestamps, and metadata are clearly visible without being harsh.

### 5. Add Cinematic Button Glow to Bottom Nav Active State

**File**: `src/components/BottomNavigation.tsx`

The active pill currently has a subtle orange tint. Increase the glow intensity:
- Dark: `rgba(255,107,53,0.22)` → `rgba(255,107,53,0.30)` background
- Dark: box-shadow `0 0 16px` → `0 0 20px rgba(255,107,53,0.35)`

This makes the active tab "pop" with more confident presence.

### 6. Sharpen Glass Surface Tokens

**File**: `src/styles/tokens.css`

Increase glass background opacity slightly for dark themes:
- `--glass-bg`: `rgba(255,255,255,0.04)` → `rgba(255,255,255,0.06)`
- `--glass-border`: `rgba(255,255,255,0.08)` → `rgba(255,255,255,0.12)`

This makes glass surfaces more distinguishable from the void behind them.

---

### Files Changed

| File | What |
|------|------|
| `src/styles/matte-themes.css` | Brighter primaries, deeper surface separation, higher text contrast |
| `src/styles/tokens.css` | Sharper glass tokens for dark themes |
| `src/components/ui/button.tsx` | Inner highlight + cinematic shadow on primary buttons |
| `src/components/BottomNavigation.tsx` | Stronger active tab glow |

### Safety

- Zero layout changes — only color values, shadows, and opacity
- Zero logic changes — no routing, no state, no data
- All changes are CSS token adjustments and shadow additions
- Fully reversible by reverting token values


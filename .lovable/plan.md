

## Plan: HD Cinematic Polish — Rounded Vignette Header + Vibrant Icon System + Micro-Interaction Upgrade

### What we're doing

Transforming the app from "solid and functional" to "you want to touch it" — the Tinder/Instagram HD feeling where every element has depth, vibrancy, and organic roundness.

### Changes

#### 1. Header — Remove frames, add cinematic rounded vignette

Replace the flat/transparent header background with a **curved vignette shadow** that fades from the top edge of the screen. No border, no box, no frame — just a natural dark-to-transparent gradient with rounded falloff that makes icons float on the content like they do in Instagram Stories or Tinder's overlay UI.

**File**: `src/index.css` (`.app-header` class) + `src/components/TopBar.tsx`

- Remove any `bg-background/80 backdrop-blur-xl` from the header — make it fully transparent
- Add a CSS `mask-image` or radial gradient pseudo-element that creates a soft rounded vignette from the top corners
- All header buttons become pure floating icons — no glass backgrounds, no borders, just icons with subtle drop-shadows for legibility
- The `GradientMaskTop` component already exists and does this partially — we'll increase its role and remove the header's own background entirely

#### 2. Icon Vibrancy — HD color system for header buttons

Currently icons use `text-amber-300`, `text-rose-500` etc. — these feel flat compared to Instagram/Tinder. Upgrade to:

- **Sharper icon colors** with subtle `filter: drop-shadow()` glow matching each icon's hue
- **Thicker stroke weight** (2.5 → 3) for icons at 18-20px size — makes them pop like native iOS icons
- Icons get a micro `text-shadow` or `drop-shadow` that gives them the "HD backlit" feeling
- Active states get a subtle breathing glow animation

**File**: `src/components/TopBar.tsx`

#### 3. Bottom Navigation — Rounder, more alive

The bottom nav already has `borderRadius: 32px` which is good. Enhance:

- Increase active pill glow intensity — currently `rgba(255,107,53,0.15)` in dark mode, boost to `0.25` with a subtle `box-shadow` glow ring
- Active icon gets a subtle continuous micro-pulse (not distracting, just alive)
- Inactive icons get slightly more contrast — bump from `0.55` to `0.65` opacity in dark mode

**File**: `src/components/BottomNavigation.tsx`

#### 4. Page Transitions — Smoother cross-fade

Currently pages mount/unmount without transition. Add a lightweight `motion.div` wrapper in `AppLayout.tsx` around `{children}` with:

- `initial={{ opacity: 0 }}` → `animate={{ opacity: 1 }}` with 120ms duration
- No scale, no slide — just a fast silk fade that makes navigation feel like content is "resolving" rather than "popping in"

**File**: `src/components/AppLayout.tsx`

#### 5. Global Polish — Rounded corners everywhere

Audit and upgrade corner radii across the design system:

- Bump `--radius-md` from 14px → 16px
- Bump `--radius-lg` from 20px → 24px  
- These cascade through all cards, modals, and containers automatically via the token system

**File**: `src/styles/tokens.css`

### Technical details

| File | Change |
|------|--------|
| `src/index.css` | Make `.app-header` fully transparent, remove background |
| `src/components/TopBar.tsx` | Remove `bg-background/80 backdrop-blur-xl`, add HD drop-shadows to icons, increase icon sizes to 18-20px with strokeWidth 3 |
| `src/components/BottomNavigation.tsx` | Boost active pill glow, increase inactive icon opacity, add subtle active breathing |
| `src/components/AppLayout.tsx` | Wrap `{children}` in a `motion.div` with 120ms opacity fade keyed by pathname |
| `src/styles/tokens.css` | Bump `--radius-md` to 16px, `--radius-lg` to 24px |
| `src/components/ui/GradientMasks.tsx` | Slightly increase top gradient intensity to compensate for removed header bg |

No layout, routing, or swipe physics changes. Pure visual evolution.


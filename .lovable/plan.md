

## Plan: Rebrand to "Swipess" Wordmark Logo + Stop Radio Auto-Start

### 1. Replace Fire S icon with "Swipess" wordmark on the landing page

The main landing page currently shows the Fire S flame icon (`SwipessLogo` component using `fire-s-logo-512.png`). The user wants the **text wordmark "Swipess"** — same style as the bottom-right corner text (italic, gradient orange-to-pink, bold) — to be the hero branding element instead.

**Changes:**
- **`src/components/LegendaryLandingPage.tsx`**: Replace the `LogoImage` component (which renders `SwipessLogo size="4xl"`) with a styled text wordmark: large italic font-black gradient text reading "Swipess". Same orange→rose→pink gradient already used in the auth heading. Remove the `SwipessLogo` from the auth view header (line 325) and replace with the wordmark too.
- The `SwipessLogo` component (Fire S icon) stays intact for use in smaller UI spots (settings pages, AI chat avatars, etc.) — only the landing page hero gets the wordmark treatment.

**Wordmark design:**
- Text: "Swipess" (no capital second S)
- Style: `font-black italic tracking-tight`, gradient `from-orange-300 via-rose-400 to-pink-500`
- Size on landing: ~`text-7xl` to `text-8xl` for dramatic hero impact
- Size on auth card: `text-3xl`

### 2. Stop radio from auto-starting

The radio defaults to `isPoweredOn: true` in `RadioContext.tsx` line 52. This means every time the provider mounts (page load, sign-in), the radio is "on" and ready to play — and certain interactions trigger `play()` automatically.

**Changes:**
- **`src/contexts/RadioContext.tsx`**: Change default `isPoweredOn` from `true` to `false` (line 52). Radio only activates when the user explicitly taps the radio button.
- The `loadUserPreferences` function (line 253) already respects the saved `radio_is_powered_on` preference — so returning users who turned it on will still have it on. New/fresh sessions default to off.

### 3. Fix useState crash (App.tsx line 224)

The runtime error shows `Cannot read properties of null (reading 'useState')` at `App.tsx:224`. This is likely a React import/bundling issue that will be investigated and resolved during implementation.

### Files to Edit

| File | Change |
|---|---|
| `src/components/LegendaryLandingPage.tsx` | Replace `LogoImage`/`SwipessLogo` with "Swipess" text wordmark on both landing and auth views |
| `src/contexts/RadioContext.tsx` | Default `isPoweredOn: false` to prevent auto-start |
| `src/App.tsx` | Investigate and fix the useState crash at line 224 |


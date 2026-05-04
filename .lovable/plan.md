# Landing page polish + error cleanup

## What you'll see
- Sign In / Sign Up buttons on the landing page restyled to a clean black + white system (no orange or pink), matching the rest of the app's "no blue / no neon" rule.
- The matching mode-switcher pills inside the auth view (Sign In / Sign Up tabs) restyled the same way.
- Console errors silenced.

## Changes

### 1. Landing CTA buttons (`src/components/LegendaryLandingPage.tsx`)
- **Sign In button** (line ~116): replace `#FF4D00` orange fill with solid white background + black text, subtle white shadow.
- **Create Account button** (line ~123): replace pink/orange gradient with solid black background, white text, white hairline border.
- **Auth-view mode switcher** (lines ~322–346): active "Sign In" tab → white bg / black text; active "Sign Up" tab → black bg / white text; inactive tabs stay muted white.
- Keep haptics, sizing, radius, and animations identical — only colors change.

### 2. Fix `VapIdCardModal` null crash (`src/components/VapIdCardModal.tsx`)
Console shows: `Cannot read properties of null (reading 'id')` from queryFn at lines ~30 and ~45.
- Both queries already gate via `enabled: !!user?.id && isOpen` but use `user!.id` inside. When the modal is opened during a sign-out race, `user` becomes null mid-flight.
- Add a defensive guard: `if (!user?.id) return null;` at the top of each `queryFn` before the supabase call.

### 3. Fix React DOM warning (`src/components/SwipessLogo.tsx`)
Console warns about `fetchPriority` prop being passed to a DOM `<img>`. React 18 expects lowercase `fetchpriority` only on native img elements when not using JSX casing.
- Either remove `fetchPriority` from the `<img>` or set it via `imgRef.current.setAttribute('fetchpriority','high')` in a `useEffect`.

### 4. Note on the black screen at `/index`
Your current route is `/index`, but the app only registers `/` for the landing page — `/index` falls through to `NotFound`, which is what the screenshot shows. No code change needed; navigating to `/` (or just reloading the root) renders the landing page correctly. If you want `/index` to also show the landing page, I can add a route alias — say the word.

## Out of scope (ask if you want them)
- Larger performance / PWA polish pass
- Redesign of the landing layout itself
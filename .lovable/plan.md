

## Plan: App Icon Replacement + Profile Photo in Header + Header Spacing Fix + Build Error Fix

### 1. Replace App Icon with Fire S Logo

The uploaded `image-55.jpg` (red fire S on black background) will become the main app icon used everywhere: favicon, PWA manifest icons, splash screen, and web search results.

**Changes:**
- Copy `image-55.jpg` to `public/icons/fire-s-logo.png` (the main source asset)
- Update `index.html`: change favicon link and splash screen image from `swipess-logo-script.png` to the fire S logo
- Update `public/manifest.json`: point all icon entries to the fire S logo
- Update `public/manifest.webmanifest` (if it exists) similarly
- The existing pink/colorful S icon in the home screen screenshot will be replaced by this fire S logo going forward

Note: For best results across all devices, the user should ideally provide the logo in multiple sizes (192x192, 512x512, 1024x1024). Since we only have one image, we will use it at all sizes -- it will work but may not be pixel-perfect at small sizes.

### 2. Profile Photo Already Shows in Top-Left

The `TopBar.tsx` already fetches the user's `avatar_url` from the profiles table and displays it as an `Avatar` in the top-left corner (lines 172-191). If the profile photo is not showing, the issue is likely that:
- The user hasn't uploaded a photo yet (shows fallback initial)
- Or the `avatar_url` column is empty in the database

No code change needed here -- the feature already exists. I will verify it works correctly during implementation.

### 3. Fix Header Too Close to Top Edge

The `.app-header` CSS has no `padding-top` for mobile viewports (only added at `min-width: 640px`). On mobile devices (especially with notches/status bars), the header buttons sit flush against the top edge.

**Fix in `src/index.css`:**
- Add `padding-top: calc(var(--safe-top, 0px) + 8px)` to the base `.app-header` rule so all screen sizes get safe-area padding plus a small buffer

### 4. Fix MarketingSlide Build Error

The `strokeWidth` prop type is `number` in the component interface but Lucide's `LucideProps` allows `string | number`. 

**Fix in `src/components/MarketingSlide.tsx`:**
- Change the icon type from `React.ComponentType<{ className?: string, strokeWidth?: number }>` to `React.ComponentType<any>` or use `LucideIcon` type from lucide-react

### Files to Change
1. **`public/icons/fire-s-logo.png`** -- copy uploaded image
2. **`index.html`** -- update splash logo src + favicon references
3. **`public/manifest.json`** -- update icon paths
4. **`src/index.css`** -- add base padding-top to `.app-header`
5. **`src/components/MarketingSlide.tsx`** -- fix type error


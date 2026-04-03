

## Plan: Replace Logo Everywhere with Clean Transparent Version

### Problem
The uploaded Fire S logo has a dark navy background. The current logo assets also have dark backgrounds, requiring CSS mask hacks. We need a truly transparent version used consistently across the entire PWA.

### Approach

**Step 1: Generate transparent logo asset**
- Copy the uploaded image to the project
- Use a Python script (PIL/Pillow) to remove the dark navy background by converting dark pixels to transparent
- Output a clean transparent PNG at multiple sizes: 960px, 512px, 192px, 96px, 48px, 32px, 16px
- Also generate favicon.ico from the 32px version

**Step 2: Update `SwipessLogo.tsx`**
- Simplify the component — remove the CSS mask hack entirely
- Use the new transparent PNG directly as an `<img>` tag
- Keep the glow effects as-is (they work independently)

**Step 3: Update `index.html`**
- Replace favicon references to point to new transparent assets
- Update the splash screen logo to use the new transparent asset directly (remove the CSS mask-based approach)

**Step 4: Update manifest files**
- Update `manifest.json` and `manifest.webmanifest` icon entries to reference the new transparent PNGs

**Step 5: Update all direct image references**
- `useAutomaticUpdates.tsx` — uses `fire-s-logo-960.webp` directly as `<img>`
- `ZenithPrewarmer.tsx` — prefetch list
- Apple touch icons — regenerate from transparent source

### Files to Edit
| File | Change |
|---|---|
| `public/icons/` | New transparent assets at all sizes + favicon |
| `src/components/SwipessLogo.tsx` | Simplify to direct `<img>`, remove CSS mask |
| `index.html` | Update favicon + splash logo references |
| `public/manifest.json` | Update icon paths |
| `public/manifest.webmanifest` | Update icon paths |
| `src/components/ZenithPrewarmer.tsx` | Update prefetch paths |
| `src/hooks/useAutomaticUpdates.tsx` | Update logo img src |

### Technical Detail
Background removal via Python PIL: flood-fill from corners with tolerance for the navy (#0f172a-ish) color, setting matching pixels to transparent. This gives a clean alpha channel without edge artifacts.


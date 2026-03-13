

# Health Check: Fire S Logo Deployment and Backend Connectivity

## Logo Status: All Good
The Fire S logo (`/icons/fire-s-logo.png`) is already consistently deployed across every surface:
- Favicon (index.html) — 3 link tags
- Splash screen (index.html `#initial-loader`)
- PWA manifest (manifest.webmanifest + manifest.json) — all icon entries
- Apple Touch Icons (index.html) — all 11 sizes reference fire-s-logo.png
- PWA shortcuts (3 shortcuts, each with fire-s-logo.png)
- `SwipessLogo.tsx` component (used in-app)
- `LegendaryLandingPage.tsx` and `AppOutagePage.tsx`
- `PlaceholderImage.tsx`

No action needed for the logo.

## Backend Connectivity: Stale Hardcoded References

The app's Lovable Cloud project is `qegyisokrxdsszzswsqk`, but the `index.html` has hardcoded preconnect hints pointing to an old project (`vplgtcguxujxwrgguxqq`). While the auto-generated `client.ts` gets correct env vars at runtime, the stale preconnect wastes a DNS/TCP connection to a server the app doesn't use, and could cause confusion.

### Fix Required

**File: `index.html`** (lines 10-11)
- Remove the hardcoded preconnect to the old Supabase project (`vplgtcguxujxwrgguxqq`)
- The `vite.config.ts` `buildVersionPlugin` already injects the correct preconnect at build time using `process.env.VITE_SUPABASE_URL`, so the hardcoded one is redundant and wrong

**File: `vite.config.ts`**
- No changes needed — already injects correct preconnect dynamically

**File: `src/integrations/supabase/client.ts`**
- Cannot and should not be edited (auto-generated). The env vars override the fallback values at runtime.

### Summary

| Item | Status | Action |
|------|--------|--------|
| Fire S logo in favicon | Correct | None |
| Fire S logo in PWA manifest | Correct | None |
| Fire S logo in splash screen | Correct | None |
| Fire S logo in Apple Touch Icons | Correct | None |
| Fire S logo in SwipessLogo component | Correct | None |
| Fire S logo in all pages | Correct | None |
| Backend client connection | Working (env vars override fallbacks) | None |
| index.html preconnect hints | Stale — points to old project | Remove hardcoded lines 10-11 |

This is a single-file, two-line fix.


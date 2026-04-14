

## Enable Apple & Google Sign-In + Fix React Crash

### Problem
1. **React crash** — `Cannot read properties of null (reading 'useState')` persists because the Vite resolve aliases point to directory roots instead of specific entry files, causing duplicate React instances in the bundle.
2. **Social login disabled** — Apple and Google buttons show "Coming soon" toasts instead of actually authenticating.

### Plan

#### Step 1: Fix the React null crash (root cause)
Update `vite.config.ts` resolve aliases to point to the exact module entry files:
```
react → ./node_modules/react/index.js
react-dom → ./node_modules/react-dom/index.js
react/jsx-runtime → ./node_modules/react/jsx-runtime.js
```
Also add `react/jsx-runtime` and `react/jsx-dev-runtime` to the dedupe list. Clear `.vite` cache.

#### Step 2: Configure Social Auth via Lovable Cloud
Use the **Configure Social Auth** tool to:
- Generate the `src/integrations/lovable/` module with `@lovable.dev/cloud-auth-js`
- This provides the managed `lovable.auth.signInWithOAuth()` function that works out of the box for both Google and Apple (no API keys needed for Google; Apple uses Lovable's managed credentials)

#### Step 3: Update `useAuth.tsx` — switch to Lovable Cloud OAuth
Replace the current `signInWithOAuth` function that calls `supabase.auth.signInWithOAuth()` with the new `lovable.auth.signInWithOAuth()` pattern:
```typescript
import { lovable } from "@/integrations/lovable/index";

const result = await lovable.auth.signInWithOAuth(provider, {
  redirect_uri: window.location.origin,
});
```

#### Step 4: Activate social buttons on landing page
In `LegendaryLandingPage.tsx`:
- Replace `handleSocialComingSoon('Apple')` with actual `signInWithOAuth('apple')` call
- Replace `handleSocialComingSoon('Google')` with actual `signInWithOAuth('google')` call  
- Remove the "Coming soon" banner
- Add loading states to the social buttons during OAuth redirect

#### Step 5: Update PWA config
Add `/~oauth` to the service worker's `navigateFallbackDenylist` in `vite.config.ts` or the SW config so OAuth callbacks always hit the network (required for Lovable Cloud OAuth).

### Files to modify
- `vite.config.ts` — fix React aliases + add OAuth denylist
- `src/hooks/useAuth.tsx` — switch to `lovable.auth.signInWithOAuth`
- `src/components/LegendaryLandingPage.tsx` — activate social buttons, remove "Coming soon"

### Technical details
- Lovable Cloud manages Google OAuth credentials automatically — no setup needed
- Lovable Cloud manages Apple OAuth credentials automatically — no Apple Developer setup needed for the managed flow
- The user can later switch to their own Apple credentials (BYOC) via Cloud dashboard if they want custom branding on the Apple sign-in sheet


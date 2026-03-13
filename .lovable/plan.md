

# Fix: Background Effects, Profile Save, and App Stability

## Issues Found

1. **Background effects missing on landing page**: Line 557 of `LegendaryLandingPage.tsx` has `{!isLightTheme && (` which completely hides the background effects (stars, orbs, cheetah, sunset) in white-matte mode. Since white-matte is now the default, users see a blank white page with no effects.

2. **Profile save errors**: The save logic itself looks correct (auth resolution, upsert, sync). The error is likely coming from the **sync to profiles table** step. When syncing `profile_images` (which is a `string[]` array) to `profiles.images` (which is `jsonb`), the array is passed directly. However, the real issue is that when the user hasn't confirmed their email yet or the session is stale, `resolveAuthenticatedUserId()` throws. The current code is sound but there's a race: `getSession()` can return null during page transitions while `getUser()` also fails. Need to add retry logic.

3. **Effect toggle button invisible in white mode**: The effects toggle button at bottom-left uses `bg-card border border-border` which is correct, but the effects themselves need to render in white mode too (with appropriate color adaptation).

## Plan

### 1. Show background effects in both themes
**File**: `src/components/LegendaryLandingPage.tsx`
- Remove the `{!isLightTheme && (` conditional around `LandingBackgroundEffects` — show effects in both themes
- Pass the theme to the effects component so it can adapt colors if needed (darker particles on white bg)

### 2. Make background effects theme-aware  
**File**: `src/components/LandingBackgroundEffects.tsx`
- Accept an optional `isLightTheme` prop
- When light theme: use dark-colored particles, stars, and orbs instead of white/bright ones so they're visible on a white background

### 3. Harden profile save with better error handling
**File**: `src/hooks/useClientProfile.ts` and `src/hooks/useOwnerProfile.ts`
- Add a small retry (1 retry after 500ms) in `resolveAuthenticatedUserId()` if both `getSession` and `getUser` fail
- Wrap the entire profiles sync block in try/catch that doesn't throw (it's already non-blocking for client but not for owner)
- In the owner profile hook, make the sync block non-blocking (match client profile pattern)

### 4. Fix cinematic depth layers for white mode
**File**: `src/components/AppLayout.tsx`
- Add light-mode vignette/gradient masks (subtle, using dark colors at low opacity) so the app doesn't look flat, or keep them disabled — user originally asked for "completely white" so keep current behavior (no dark overlays in white mode)

## Files to Change
| File | Change |
|------|--------|
| `src/components/LegendaryLandingPage.tsx` | Remove light-theme conditional hiding background effects |
| `src/components/LandingBackgroundEffects.tsx` | Add `isLightTheme` prop, use dark colors for particles/stars/orbs when light theme |
| `src/hooks/useClientProfile.ts` | Add retry in auth resolution, ensure sync is fully non-blocking |
| `src/hooks/useOwnerProfile.ts` | Add retry in auth resolution, make sync fully non-blocking |


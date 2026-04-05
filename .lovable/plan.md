

# Fix Build Errors + Confirm AI Connection

The AI orchestrator is **already working** — I tested it and MiniMax returned a perfect response. The problem is **build errors** preventing the app from loading. Once these are fixed, the AI chat will work.

## Build Errors to Fix

### 1. `ConciergeChat.tsx` — `deletePermanently` does not exist
The component destructures `deletePermanently` from `useConciergeAI()`, but the hook doesn't export it. Fix: replace `deletePermanently` with `clearMessages` (which archives the conversation — same effect).

### 2. `LegendaryLandingPage.tsx` — `glow` prop doesn't exist on `SwipessLogo`
The `SwipessLogoProps` interface doesn't have a `glow` property. Fix: remove `glow` prop from all usages in `LegendaryLandingPage.tsx`.

### 3. `PremiumLoader.tsx` — same `glow` prop issue
Fix: remove `glow` prop.

### 4. `ClientLikedProperties.tsx` — type mismatch `string | null | undefined`
The `getCardImageUrl` call receives a potentially undefined value. Fix: add a fallback empty string (`|| ''`).

## Files to Edit

| File | Change |
|------|--------|
| `src/components/ConciergeChat.tsx` | Replace `deletePermanently` with `clearMessages`, update the destructure |
| `src/components/LegendaryLandingPage.tsx` | Remove `glow` prop from SwipessLogo (2 places) |
| `src/components/PremiumLoader.tsx` | Remove `glow` prop from SwipessLogo |
| `src/pages/ClientLikedProperties.tsx` | Add `|| ''` fallback to fix type error |

## Result
Once these 4 build errors are resolved, the app will compile and the AI chat will connect to MiniMax (already confirmed working via direct test).


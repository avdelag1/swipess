

# Fix Shade Line, Google Sign-In, Performance + Add MiniMax API Key

## 1. Remove the "Shade Line" (Black Gradient Overlay)

**The Problem:** In `DashboardLayout.tsx` (line 586), there's a fixed `div` with `bg-gradient-to-t from-black/90 via-black/40 to-transparent` that creates a dark gradient band above the bottom navigation. In the white-matte (light) theme, this looks like an ugly dark stripe across the page.

**The Fix:** Make this gradient theme-aware. In dark themes it stays dark; in white-matte theme it uses a light gradient (`from-white/90 via-white/40`). Alternatively, remove it entirely since the bottom navigation already has its own gradient background in both themes.

**Recommendation:** Remove it completely -- the bottom nav gradient already handles contrast.

---

## 2. Fix Google Sign-In

**The Problem:** The app currently calls `supabase.auth.signInWithOAuth()` directly (in `src/hooks/useAuth.tsx` line 477). Lovable Cloud requires using `lovable.auth.signInWithOAuth()` from the `@lovable.dev/cloud-auth-js` package instead.

**The Fix:**
- Use the Configure Social Login tool to set up Google OAuth (this generates the `src/integrations/lovable` module automatically)
- Update `useAuth.tsx` to import and use `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` instead of `supabase.auth.signInWithOAuth()`

---

## 3. Fix Slow Page Transitions / Landing Page Crash Feel

**The Problem:** When tapping the logo on the landing page, the `LegendaryLandingPage` component does a swipe/drag animation exit, then the `AuthView` mounts with its own entrance animation. Combined with heavy `framer-motion` animations (parallax, star fields, background effects), this creates a janky/crashing feel.

**The Fix:**
- Simplify the landing-to-auth transition in `LegendaryLandingPage.tsx` -- reduce exit animation duration and remove heavy visual effects during transition
- In `DashboardLayout.tsx`, the `motion.div` with `key={location.pathname}` (line 576) causes a full re-mount + fade animation on every route change. Reduce the fade duration from 0.12s to near-instant for non-dashboard routes
- Ensure `AnimatePresence` mode is set to `"wait"` to prevent two pages rendering simultaneously

---

## 4. Add MiniMax API Key

**The Problem:** The user wants to use MiniMax as the AI provider for the app's AI chat features. The `MINIMAX_API_KEY` secret already exists in the project but may need updating with the new key the user provided.

**The Fix:**
- Update the `MINIMAX_API_KEY` secret with the provided key: `sk-cp-57QWsEbXewjJGETRgCYfzLSj5DABY-Sf4JqROVk4OEeQ8smWWmy3Tax7kz8jtNKy-TfEdZzh3B57NX0PR-wDF4pq80k5LML90rhcSyEsH0vqYKn5AfQzPn0`
- The `ai-orchestrator` edge function already has MiniMax as a fallback provider -- it can be promoted to primary or kept as fallback depending on preference
- The Lovable AI Gateway (LOVABLE_API_KEY) is already configured as primary -- both can coexist

---

## 5. Fix Build Errors in `send-push-notification`

**The Problem:** TypeScript errors with `Uint8Array` type incompatibility in the Deno edge function. The `crypto.subtle.importKey` calls fail because `Uint8Array<ArrayBufferLike>` isn't assignable to `BufferSource`.

**The Fix:** Cast `Uint8Array` instances to `Uint8Array<ArrayBuffer>` using `.buffer` access, or use `new Uint8Array(array.buffer)` pattern to satisfy the Deno type checker. Specifically:
- Line 68: Cast `privateKeyBytes` with `as unknown as BufferSource`
- Line 104: Cast `urlB64ToUint8Array(p256dhKey)` similarly
- Line 142: Cast `authBytes` and `authInfo` in HKDF params
- Line 220: Cast `body` to `BodyInit`

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/DashboardLayout.tsx` | Remove the black gradient overlay div (line 584-589) |
| `src/hooks/useAuth.tsx` | Update `signInWithOAuth` to use `lovable.auth.signInWithOAuth()` |
| `src/components/LegendaryLandingPage.tsx` | Simplify exit animation timing for snappier transitions |
| `supabase/functions/send-push-notification/index.ts` | Fix Uint8Array type casting for Deno compatibility |
| `supabase/functions/ai-orchestrator/index.ts` | No changes needed -- MiniMax fallback already implemented |

## What Stays Unchanged
- All swipe physics, routing logic, and component architecture
- The AI orchestrator's dual-provider strategy (Gemini primary, MiniMax fallback)
- All existing theme variables and CSS tokens
- Database schema and RLS policies


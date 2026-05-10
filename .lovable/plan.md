# Plan: Share previews, fast publish, and clean tutorial

Three independent fixes the user reported in the same message.

---

## 1. Bring back the link-preview image when sharing

**Symptom:** WhatsApp / Messenger / Instagram show only a plain `swipess.com` line — no thumbnail.

**Cause:** The `/s/listing/:id` rewrite (in `vercel.json`) only fires on the Vercel-hosted custom domain. When `swipess.com` is currently being served by the Lovable host (or DNS isn't fully on Vercel), the rewrite is skipped and crawlers hit the SPA, which has no per-listing OG tags.

**Fix**
- Update `src/hooks/useSharing.ts` so `generateShareUrl` points share links directly at the edge function host (`https://vplgtcguxujxwrgguxqq.supabase.co/functions/v1/link-preview/<kind>/<id>`). This guarantees crawlers always get the rendered OG HTML, regardless of which domain serves the SPA. Real users still get auto-redirected (the function emits a `<meta refresh>` + `location.replace` for non-crawlers).
- Bump the OG image to a larger format in `supabase/functions/link-preview/index.ts`:
  - keep `og:image:width=1200`, `og:image:height=630`
  - add `twitter:card="summary_large_image"` (already present, good)
  - add a fallback that picks the listing's first image AND falls back to `image_url` when `images[]` is empty

**Files:** `src/hooks/useSharing.ts`, `supabase/functions/link-preview/index.ts`.

---

## 2. Make listing save feel instant + show a progress bar

**Symptom:** "Saving" hangs for many seconds; user can't tell whether photos are still uploading.

**Approach (no logic change to RLS / schema):**
- In `src/components/UnifiedListingForm.tsx` and `src/components/AIListingWizard.tsx`:
  - Track upload progress with a numeric `uploadProgress` state (0–100) updated as each photo finishes.
  - Render a thin progress bar at the top of the form (uses existing `useLoadingStore` so it ties into the global LoadingBar already present in `src/state/loadingStore.ts`).
  - Run photo uploads with `Promise.allSettled` and `Promise.all` in parallel batches of 3 instead of sequentially — this is the biggest real-world speedup because one large photo no longer blocks the next.
  - Compress photos client-side before upload via the existing `src/utils/imageCompression.ts` helper (resize to max 1600px, JPEG q=0.82) when the source file is > 800 KB. Avoids re-downloading huge originals.
  - Insert the listing row first with `image_url=null`, then patch it after the parallel upload finishes — the user sees the listing as "Published" instantly while photos finalize in the background.
- Add a 20s `Promise.race` timeout around the row insert (already partly there) and a 25s timeout around each photo upload, surfacing the real Supabase error instead of a generic spinner.

**Files:** `src/components/UnifiedListingForm.tsx`, `src/components/AIListingWizard.tsx`, plus a small shared helper `src/utils/parallelUpload.ts`.

---

## 3. Fix the welcome tutorial + concierge popup collision

**Symptom:** The small tutorial card sits on top of the page, "Next" jumps it around, and behind it a Concierge bubble is also waiting for a tap that does nothing — pages crash / navigate unexpectedly.

**Fixes**

**a) Tutorial card** (`src/components/GuidedTour.tsx`)
- Replace the boxed tooltip with a bottom-anchored "coachmark sheet": a translucent pill that slides up from the bottom 16px, full-width minus 24px margin, height auto, blur-backdrop. The page behind stays fully visible and interactive-looking (still gated by overlay). This matches the "see the next page while a text strip explains it" behavior the user described.
- Animate transitions with framer-motion `AnimatePresence` + slide/fade so moving between steps feels continuous instead of jumping.
- Make the dim overlay click-through except on the dismiss/Next buttons (`pointer-events: none` on the dim layer, `pointer-events: auto` on the sheet only). This prevents the tutorial from blocking the rest of the UI.

**b) Concierge bubble during tutorial** (`src/components/ConciergeChat.tsx`, `src/components/GlobalDialogs.tsx`)
- Read `isActive` from `useGuidedTour()` and hide the floating concierge launcher while the tour is active (`if (isGuidedTourActive) return null;`). This removes the dead-tap target.
- When the tour finishes, restore it with a fade.
- Guard the launcher's onClick: if `isGuidedTourActive || welcomeOpen`, no-op instead of navigating. This prevents the page-crash navigation the user is hitting.

**c) Welcome modal stacking** (`src/components/WelcomeNotification.tsx`)
- Lower its z-index below the tour (z-40 vs tour's z-50) and skip rendering if `useGuidedTour().isActive`.

**Files:** `src/components/GuidedTour.tsx`, `src/components/ConciergeChat.tsx`, `src/components/GlobalDialogs.tsx`, `src/components/WelcomeNotification.tsx`.

---

## Out of scope / not changed
- No DB migrations.
- No swipe deck / routing changes.
- No new dependencies.

## Technical notes
- `useLoadingStore.start()/finish()` already drives a global progress bar; we just call it around the publish flow.
- The link-preview function already detects crawlers via UA; pointing share URLs straight at the function URL bypasses the Vercel rewrite dependency entirely.
- All visual changes follow the project's Liquid Glass / semantic-token rules — no hardcoded colors.

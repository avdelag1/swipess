## What I'm fixing

Three concrete bugs you reported, scoped tight so nothing else is touched.

---

### 1. Meditation bowl sounds back on the landing page

**Where:** `src/components/LandingBackgroundEffects.tsx`

In the cosmos/`stars` mode (the real landing background), tapping currently only spawns a shooting star and never calls the zen bowl audio. The sound code only fires in `sunset` mode.

**Fix:** In `handleCanvasPointerDown`, also call `uiSounds.playZenBowl()` when `mode === 'stars'` (gated by the existing `disableSoundsRef`), so every background tap on /index plays a meditation chime again — exactly like before.

No other landing logic changes.

---

### 2. AI Listing Wizard hangs in "loading" forever (Owner side)

**Where:** `src/components/AIListingWizard.tsx` → `handleProcess`

Today the publish flow has a 45 s timeout on photo upload, but the **AI extract call** (`supabase.functions.invoke('ai-listing-extract', …)`) and the **DB insert** have no timeout and no visible error if they stall, so the user sees an infinite spinner.

**Fix:**

- Wrap the `ai-listing-extract` invoke in a 15 s `Promise.race` timeout. On timeout, just skip AI extraction and continue publishing with the raw prompt (this is what the catch already does).
- Wrap the final `supabase.from('listings').insert(...)` in a 20 s timeout. On timeout, show a clear toast and return the user to the `details` step instead of leaving the spinner.
- Surface the real Supabase error message on any insert failure (RLS, missing column, etc.) instead of a generic "Something went wrong".
- Add `console.error` breadcrumbs at each phase (`upload`, `optimize`, `publish`) so the next failure is debuggable from logs.

This keeps the existing "AI fills missing fields, user confirms" flow you asked for — the wizard already pre-fills `title / description / price / city` from the AI extract and the user still hits the publish button. We just stop it from freezing.

**Verification:**
- Try publishing with 1 photo + a one-sentence description. Confirm it lands in `/owner/properties`.
- Read recent edge-function logs for `ai-listing-extract` to confirm it actually returned, and Postgres logs for the insert.

---

### 3. SaveButton / right-swipe likes (sanity check, no behavior change)

You said the real blocker is the wizard, not the heart button. RLS on `likes` is correct (`INSERT WITH CHECK auth.uid() = user_id`, plus UPDATE / DELETE / SELECT policies). I will not touch `useSwipe` or `SaveButton` in this plan. If after fix #2 you still can't save a card, we'll open a separate plan with logs.

---

## Files touched

```
src/components/LandingBackgroundEffects.tsx   (add bowl sound to stars mode)
src/components/AIListingWizard.tsx            (timeouts + clear errors in handleProcess)
```

No DB migrations, no new dependencies, no design changes.
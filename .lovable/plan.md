# AI Listing Wizard — Fixes & Polish

## Problems

1. **Listing creation fails.** `AIListingWizard` POSTs to `ai-concierge`, which returns a streamed SSE body (MiniMax/OpenRouter). The wizard does `resp.json()` on it → `Unexpected token ':', ": OPENROUT"...` → "Something went wrong with the AI processing." No listing is ever generated.
2. **Magic refine button broken.** Same root cause. Kimi path needs `VITE_MOONSHOT_API_KEY` (not configured), so it always falls back to the streaming `ai-concierge` endpoint and crashes with the same SSE parse error.
3. **Mic has no instructions.** First-time users don't know to tap → speak → tap again to transcribe.
4. **Send icon hard to see in light theme.** In the AI Concierge chat input, the send button uses `bg-foreground text-background` on light, which on the cream/white surface still reads, but the user reports a contrast issue. We'll firm it up with a stronger primary fill and a visible ring so it pops on both themes.

## Changes

### A. New edge function `ai-listing-extract` (non-streaming, returns JSON)

`supabase/functions/ai-listing-extract/index.ts`
- `verify_jwt = false`, CORS enabled.
- Accepts `{ task: 'extract' | 'refine', category, price, city, prompt }`.
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) **without** `stream: true`.
- For `extract`: uses tool-calling (`function` with a JSON schema for `title, description, price, city, beds, baths, year, model, etc.`) and returns `{ data: {...} }`.
- For `refine`: returns `{ text: "..." }` — clean rewrite of the user prompt.
- Surfaces 429/402 errors clearly.
- Add to `supabase/config.toml`.

### B. Rewire `src/components/AIListingWizard.tsx`

- Replace both `fetch(AI_URL...)` blocks with `supabase.functions.invoke('ai-listing-extract', { body: {...} })`.
- Drop the `refineWithKimi` import and the hardcoded anon-JWT strings.
- On `handleProcess`: read `data.data`, merge with uploaded image URLs, advance to `review`.
- On `handleRefinePrompt`: read `data.text`, replace `prompt`.

### C. Mic instruction popover (first-time + on-demand)

- In the details step, wrap the big mic button in a `Popover` that auto-opens the first time the wizard mounts (`localStorage` flag `swipess.miclistingTip.v1`).
- Also add a small `(?)` info chip next to the mic that re-opens it.
- Copy: "Tap once and describe your listing out loud. Tap again to stop and transcribe. Then hit the magic wand to polish, or Initialize Optimization to generate."
- Same one-shot popover for the magic-wand refine button: "Polishes your spoken text into a sharper listing description."

### D. Send-icon contrast in `ConciergeChat.tsx`

- Switch the send button to `bg-primary text-primary-foreground` with a subtle `ring-1 ring-primary/30` and stronger shadow on both themes (no more `bg-foreground/bg-white` swap).
- Bump `strokeWidth` to 3 and size to `h-5 w-5` for legibility.

### E. Cleanup

- Delete dead `src/lib/kimi.ts` import from the wizard (file can stay for future use).
- Add a small inline error banner inside the wizard so 429/402 from the new function are visible without bouncing the user back to step `details` silently.

## Files touched

- `supabase/functions/ai-listing-extract/index.ts` *(new)*
- `supabase/config.toml` *(add function block)*
- `src/components/AIListingWizard.tsx`
- `src/components/ConciergeChat.tsx`

## Verification

- Build passes.
- Manually: open AI Listing → Property → upload 1 photo → tap mic, say "two bedroom apartment in Tulum 2500 a month, pool and laundry" → tap to stop → magic wand polishes prompt → Initialize → review screen shows title/price/city/description → Continue opens UnifiedListingForm prefilled.
- Send button visible on both light and dark themes at 392px.

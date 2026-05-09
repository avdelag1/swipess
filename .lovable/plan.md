
# Swipess Polish & Reliability Pass

This is a multi-area pass. To keep risk low and quality high, I'll break it into 4 focused tracks and execute them sequentially in build mode. Each track ends with a verification step before moving on.

## Track 1 — Fix current errors & app boot

1. **i18next warning** (`useTranslation: You will need to pass in an i18next instance`) — `src/i18n/index.ts` is not being imported on the boot path. Import it once in `src/main.tsx` so `initReactI18next` registers before any component calls `useTranslation`.
2. **Edge function deploy error** (`validate-google-play-purchase` entrypoint) — config block currently references a function whose `index.ts` is intermittently missing from the deploy bundle. Confirm the file exists and is exported correctly; if not, remove the config block until the function is rebuilt.
3. **MaintenanceGate gate** — leave logic intact (it's intentional) but verify the unlock persists across reloads on the deployed PWA build.
4. Run a TypeScript pass and clear any stale references created during the recent listing/AI edits (`useSmartListingMatching.tsx` post-Sophia removal, `ConciergeChat.tsx`, `ai-concierge/index.ts`).

## Track 2 — Real listings first in the deck

1. Audit `get_smart_listings` RPC + `useSmartListingMatching` ordering. Today seeded/demo placeholders can outrank real owner listings.
2. Update ordering so real user listings (non-seed `owner_id`) are returned **first**, with demo/seed listings only used as fallback when the deck is empty.
3. Add a `seedExclude` flag the client can pass to hide demos entirely once the database has ≥ N real active listings.
4. Verify with `read_query` that there are real `listings` rows and that the deck shows them on `/client/dashboard`.

## Track 3 — AI listing creation working end-to-end

1. Verify `GOOGLE_API_KEY` secret is wired into `ai-listing-extract` (Gemini). Confirm via `edge_function_logs` that calls succeed.
2. In `ai-concierge/index.ts`, ensure the assistant can:
   - Detect listing-creation intent from chat.
   - Call `ai-listing-extract` (or the Gemini model directly) to structure the listing payload.
   - Insert into `listings` with the authenticated user's `user_id`/`owner_id`.
   - Return a deep link `/listing/<id>` and an inline preview card in the chat (image, title, price, city).
3. In `ConciergeChat.tsx`, render listing previews when the assistant replies with `[LISTING:<id>]` or a structured listing block — tap opens the listing detail; long-press copies a shareable URL.
4. Smoke test: ask the AI to "create a listing for a 2BR loft in Tulum, $1800/mo, jungle view" and verify the row appears in `listings` and the preview renders in chat.

## Track 4 — Cross-device, PWA, deep-link polish

1. **Universal links**: ensure `/listing/:id` and `/profile/:id` work in:
   - Web (standalone tab).
   - PWA (installed home-screen).
   - Native shell (Capacitor). Open in app when installed; fall back to web otherwise via `intent://` (Android) and Universal Links (iOS) — already partially set up via `MaintenanceGate.hasTrustedPublicEntry`.
2. **Open Graph / share previews**: confirm `/listing/:id` returns proper OG tags so links shared in chat or social render with image + title.
3. **Performance**:
   - Audit `SwipessPrewarmer` preconnect list (currently includes `supabase.co` and unused avatar domains) — keep only domains we hit in the first 3s.
   - Defer non-critical chunks (`vendor-viz`, `ClientSecurity`, `LegalHub`) behind interaction.
   - Verify `loading="lazy"` + `decoding="async"` on every card image.
4. **Visual polish per Design Evolution Memory**:
   - Bump primary swipe buttons to 64–72px diameter, icon 28–32px.
   - Layered shadows on the card stack (4 / 12 / 24 / 60 px elevation tiers).
   - Replace any pure `bg-black` / `text-white` with semantic tokens.

## Verification checklist (run at end)

- No console errors on boot.
- Real user listings appear first on `/client/dashboard`.
- AI chat creates a listing row + renders an in-chat preview with deep link.
- Shared `/listing/:id` URL opens correctly in browser, installed PWA, and Capacitor build.
- Lighthouse mobile performance ≥ 90 on the published build.

## Technical details

- Files touched (expected): `src/main.tsx`, `src/i18n/index.ts`, `src/hooks/smartMatching/useSmartListingMatching.tsx`, `src/components/ConciergeChat.tsx`, `src/components/SwipessPrewarmer.tsx`, `src/components/SwipessSwipeContainer.tsx` (button sizing), `supabase/functions/ai-concierge/index.ts`, `supabase/functions/ai-listing-extract/index.ts`, possibly a new migration to refine `get_smart_listings` ordering.
- No schema changes expected beyond the RPC ordering tweak.
- No new secrets required — `GOOGLE_API_KEY`, `LOVABLE_API_KEY`, `MINIMAX_API_KEY` already configured.

## Clarifying question before I start

The scope is large. Do you want me to do **all four tracks** in one go (longer single run), or stop after each track so you can review the result?

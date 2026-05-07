## What you asked for

1. Remove the extra floating microphone that opens the AI assistant from /events and other pages.
2. Make sure the real microphones (AI chat input + AI Listing Wizard "Intel Stream") request OS permission cleanly and actually transcribe.
3. Fix the AI listing flow so the listing actually gets created.
4. Redesign the AI chat UI to match your two reference mockups (light + dark variants, gradient send button, "Popular Topics" cards, inline listing preview cards, suggestion chips), keeping the existing Supabase backend (`ai-concierge` edge function).

## What I found

- The "extra mic" is `src/components/VoiceConciergeButton.tsx`, mounted globally in `AppLayout.tsx`. It floats on every dashboard/explore route (including `/explore/eventos`) and just opens the AI chat — this is the one to delete.
- The two real mics are correct and use `useVoiceTranscribe` (browser `getUserMedia` → `voice-transcribe` edge function): `ConciergeChat.tsx` and `AIListingWizard.tsx`. They already toast on permission denial; what's missing is a clear pre-prompt and a proper "Intel Stream" handoff that builds the listing.
- The `ai-concierge` edge function already pulls real listings (`searchListings`) and emits `[NAV:/path]`, `[FILTER:{…}]`, `[DRAFT:…]` tags. The chat parses these but renders listings as plain markdown bullets — the redesigned chat will render them as proper preview cards.
- `ConciergeChat.tsx` (889 lines) is the right component to evolve. We will refine, not replace, to honor the structural-protection rule.

## Plan

### 1. Remove the rogue mic
- Delete `src/components/VoiceConciergeButton.tsx`.
- Remove its lazy import + render in `src/components/AppLayout.tsx` (lines 22 and 247–252).

### 2. Microphone permission + reliability
- In `useVoiceTranscribe.ts`: before requesting the stream, check `navigator.permissions.query({ name: 'microphone' })` when available; if `denied`, surface a clear toast with instructions instead of silently failing.
- In `ConciergeChat.tsx` and `AIListingWizard.tsx`: when the user first taps the mic, show a one-line inline hint ("Allow microphone to dictate your listing") and on `getUserMedia` rejection, render a recoverable error state with a retry button.
- iOS/in-app browser: keep the existing `MediaRecorder` fallback path; ensure it is the only path on iOS Safari (it already is — no change needed beyond the UX above).

### 3. Listing creation actually works
- In `AIListingWizard.tsx`, after voice transcription + photo upload, the wizard should call the existing `ai-profile-extract` / concierge draft path and then `UnifiedListingForm` save logic. Verify the payload uses `owner_id` only (per recent fix) and that the photos array is populated from compressed uploads before `insert into listings`.
- Add a clear error toast when the insert fails, surfacing the Supabase error message instead of a generic "failed".

### 4. Redesigned AI chat (matches your mockups)

Refine `ConciergeChat.tsx` only — no new component, no logic rewrite.

Visual changes:
- Header: rounded white/dark surface, "Swipess AI / Online" with subtle gradient avatar using existing `SwipessLogo`. Slim chevron-back, slim more-menu.
- Welcome state: "Hey there! 👋 What can I help you with today?" + 6 "Popular Topics" cards in a 2-col grid (Real Estate, Rentals, Motorcycles, Bicycles, Find Workers, Find Clients). Each card: rounded-2xl, soft surface, gradient icon. Tapping a card seeds the input with a starter prompt.
- Message bubbles:
  - User: gradient bubble (`from-[hsl(var(--primary))] to-[#A855F7]`), white text, right-aligned, rounded-3xl with single tail corner.
  - AI: light card on light theme, elevated `bg-card` on dark, with `prose-invert` markdown.
- Inline listing preview cards: when `searchListings` returns results, the edge function will also emit a structured `[LISTINGS:[{id,title,price,image,beds,baths,m2,city}]]` tag. The chat parses it and renders compact swipe-style cards inline (image, title, price, meta row, "View Details" button → `[NAV:/listing/:id]`). Existing markdown bullet fallback stays for text-only models.
- Suggestion chips below the latest AI reply ("Show me more options", "What about apartments?") — already partially supported via `[NAV:]`; we'll render them as pill buttons.
- Composer: rounded-full input, gradient circular send button, mic on the left, `+` attachment on the right, all matching mockup spacing (Power Ratios: 56px input height, 44px buttons, 16px gap).
- Bottom nav: keep existing `BottomNavigation` — do not duplicate.

Light/dark:
- Use existing semantic tokens (`bg-background`, `bg-card`, `text-foreground`, `--primary`). No hardcoded hex except the explicit gradient stops, which we'll add as CSS variables `--ai-grad-from` / `--ai-grad-to` in `index.css` so both themes pick up correctly.

### 5. Backend touch
- Edit `supabase/functions/ai-concierge/index.ts`: when `searchListings` returns rows, also append a JSON `[LISTINGS:…]` tag (in addition to the markdown summary) so the new chat can render rich cards. No DB changes, no new tables.

### 6. Sync
- After implementation, the changes flow through the existing Lovable→GitHub pipeline (`mirror-to-original.yml`). I won't run git commands manually per project policy.

## Files to change

- delete: `src/components/VoiceConciergeButton.tsx`
- edit: `src/components/AppLayout.tsx`
- edit: `src/hooks/useVoiceTranscribe.ts`
- edit: `src/components/ConciergeChat.tsx` (largest change — visual refinement)
- edit: `src/components/AIListingWizard.tsx` (mic UX + save error surfacing)
- edit: `src/index.css` (gradient tokens for AI chat)
- edit: `supabase/functions/ai-concierge/index.ts` (emit `[LISTINGS:…]` tag)

## Out of scope

- No changes to swipe physics, routing, BottomNavigation, or the `listings` schema.
- No new dependencies.
- No changes to other mic surfaces (MessagingInterface, RoommateMatching) — those already work and aren't reported as broken.

Approve and I'll implement.
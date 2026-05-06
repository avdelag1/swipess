## Goal

You already have a working **AI Listing Wizard** with mic → transcribe → AI refines → AI extracts structured fields. Bring that same experience to **profile building** so users (Client and Owner) can just speak about themselves and the AI fills the form.

## What's already working (no changes needed)

- **AI Concierge chat mic** — silence-based auto-send, Web Speech + `voice-transcribe` edge function fallback for iOS.
- **AI Listing Wizard mic** — speak → Kimi refines copy → AI extracts category-specific JSON → photos → review → publish.
- `voice-transcribe` edge function uses Lovable AI Gateway (Gemini multimodal) and is rock solid.

## What to add — AI Profile Wizard

A new modal (`AIProfileWizard.tsx`) modeled on `AIListingWizard.tsx`, but for profiles.

### Flow

```text
1. User opens "Magic AI Profile" from their Profile page
2. Tap mic → speaks freely:
   - Client: "I'm Maria, 28, looking for a 2-bedroom in Tulum
     under $1500, pet-friendly, with my partner..."
   - Owner: "I'm a property manager with 5 years experience,
     I rent beachfront condos in Playa del Carmen, English/Spanish..."
3. Transcript appears, user can refine with Kimi (one-tap polish)
4. Tap "Build my profile" → AI extracts structured fields:
   - Client: name, age, bio, budget_range, preferred_location,
     lifestyle_tags, intent (rent/buy/roommate)
   - Owner: business_name, bio, specialties, languages,
     years_experience, service_areas, contact_preferences
5. User reviews + edits draft, uploads 1 mandatory photo
6. Save → updates client_profiles or owner_profiles
```

### Files to create

- `src/components/AIProfileWizard.tsx` — the modal (copy structure from `AIListingWizard.tsx`, adapt steps to: intro → photos → speak → review)
- Add `showAIProfile` + `aiProfileDraft` to `src/state/modalStore.ts`
- Mount in `src/components/GlobalDialogs.tsx`

### Files to edit

- `src/pages/ClientProfileNew.tsx` — add a "Magic AI Profile" trigger card at the top (matches the existing Owner "Magic AI Listing" button styling at line 165 of `OwnerProfile.tsx`)
- `src/pages/OwnerProfile.tsx` — add the same trigger for owner profile fields (separate from listing)
- `supabase/functions/ai-concierge/index.ts` *(or new `ai-profile-extract` function)* — accept a `mode: 'profile-client' | 'profile-owner'` and return structured JSON via tool calling (per the AI Gateway structured-output pattern). Keep system prompt server-side.

### Backend

Use the existing **Lovable AI Gateway** (no new key, already configured). Use **tool-calling structured output** (not "return JSON in text") so extraction is reliable — same pattern documented in `<connecting-to-ai-models>`.

Schema example for client profile extraction:

```text
extract_client_profile {
  name, age, bio (cinematic 2-3 sentences),
  intent: ["rent" | "buy" | "roommate"],
  budget_min, budget_max, currency,
  preferred_locations: string[],
  lifestyle_tags: string[],
  languages: string[]
}
```

### UX details (per Design Evolution Memory)

- 64–72px mic button, breathing pulse while recording
- Live transcript box with `bg-white/[0.14] border-white/25 text-white` (matches the legibility fix just made to landing page)
- "Refine with AI" pill button, loading shimmer
- Review step: each extracted field is an editable chip — tap to edit inline
- Exactly **1 mandatory photo** (per project memory rule)

### Validation

- Block save if no photo or required fields missing (name, bio for client; business_name, bio for owner)
- Sanitize bio with DOMPurify (per XSS memory)
- Save respects existing `profile_images` table for avatar (per Profile Schema memory)

## Out of scope

- No new auth, no schema changes — all fields already exist on `client_profiles` / `owner_profiles`
- Listing wizard stays as-is

## Approve to implement

Once approved I'll switch to build mode and ship it in one pass.

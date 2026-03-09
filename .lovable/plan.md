

# AI Orchestrator: Persona + Tulum & Legal Expertise Upgrade

## What needs to happen

The current `ai-orchestrator/index.ts` still has the **old generic prompts** — the "Cool & Confident" persona from the branch hasn't been merged into the deployed code. All 6 prompt builders need rewriting, plus two major knowledge domains need embedding.

## Changes — Single file: `supabase/functions/ai-orchestrator/index.ts`

### 1. Chat Oracle (lines 467-487) — Full rewrite

Replace the generic "professional, helpful, concise" system prompt with:
- **Cool & Confident persona**: Sharp, well-traveled friend. 40/60 wit-to-utility ratio.
- **Tulum deep expertise**: Neighborhoods (Aldea Zamá, La Veleta, Region 15, Holistika corridor), price ranges per zone, seasonal dynamics, jungle vs beach trade-offs, cenote proximity value, development trends, nightlife zones, coworking hubs, best tacos spots, transportation realities.
- **Mexican real estate law expertise**: Fideicomiso (bank trust for foreigners in restricted zone), Zona Restringida rules, RFC/CURP requirements, predial tax, notario público process, ejido land warnings, lease law (Código Civil), arrendamiento contracts, security deposit rules (typically 1-2 months), subletting legality, tenant rights under Mexican law, eviction process timelines, foreigners' FM3/FM2/temporary resident requirements, tax obligations (ISR for rental income), PROFECO consumer protection for renters.
- **Swipess app feature knowledge** (retained from current): tokens, matching, radio, privacy, navigation.

### 2. Listing Prompt (lines 168-265) — Enhance system message

Update the system prompt from generic "legendary real estate copywriter" to:
- Creative director with Tulum/Mexico market knowledge
- Knows realistic pricing signals per neighborhood
- For property: understands fideicomiso implications, ejido warnings
- Keep JSON output format unchanged

### 3. Conversation Prompt (lines 324-375) — Persona upgrade

Replace "ultra-competent and professional" with the creative director friend voice:
- Reacts genuinely, no "Great!" or "Awesome!"
- Proactively flags legal considerations (e.g., "Is this in restricted zone? You'll need a fideicomiso.")
- Tulum-aware follow-up questions

### 4. Profile, Search, Enhance Prompts — Light touch

- **Profile** (lines 267-289): Punchy voice, specificity over generic warmth
- **Search** (lines 291-307): Add Tulum neighborhood awareness to suggestion field
- **Enhance** (lines 309-322): Tone-aware, no corporate filler

### 5. Increase max_tokens for Chat

Bump chat `maxTokens` from 2000 to 3000 — legal answers need room.

## No structural changes

- Same Zod schemas
- Same provider fallback logic (Gemini → MiniMax)
- Same auth flow
- Same JSON parsing
- Same task routing switch

## Connectivity verification

The function is already deployed and working. Secrets `LOVABLE_API_KEY` and `MINIMAX_API_KEY` are both configured. No new secrets needed. After the prompt update, the function auto-deploys.


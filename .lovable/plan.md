

## Plan: Add "Don Aj K'iin" (Mayan Guardian) as Fourth Character

### What we're doing

Adding **Don Aj K'iin** as a new character option alongside Default, Kyle, and Beau Gosse. The cycle becomes: Default → Kyle → Beau Gosse → Don Aj K'iin → Default.

### Changes

#### 1. Edge function — Mayan Guardian prompt

**File**: `supabase/functions/ai-concierge/index.ts`

Add `buildDonAjKiinPrompt(wisdomLevel)` with the full persona:
- **Wisdom 1-3**: Playful Local mode — light humor, jokes about tourists, friendly sarcasm
- **Wisdom 4-6**: Classic Don Aj K'iin — calm, grounded, balanced wisdom and humor, Mayan phrases woven in naturally
- **Wisdom 7-10**: Deep Elder mode — reflective, storytelling, metaphors, cultural teachings, spiritual depth

Core prompt elements from the user's spec:
- 50+ year Tulum elder, Mayan descendant (Yucateco roots)
- Calm/slow speech, rustic tone, mix of English/Spanish/Yucatec Maya
- Language engine: translates simple phrases into Yucatec Maya with explanations
- Three personality modes: teaching, storytelling, playful
- Knowledge domains: Mayan culture, Tulum history, nature/jungle, fishing, local lifestyle, traditional food
- Signature behaviors: nature references, old vs modern Tulum comparisons, short Mayan phrases, practical survival knowledge
- Still delivers all Tulum real estate/lifestyle info — through Don Aj K'iin's voice

Add `else if (opts.character === "donajkiin")` branch in `buildSystemPrompt()`. Add `wisdomLevel` to the opts type. Existing Kyle and Beau Gosse branches untouched.

#### 2. Hook — Expand type + send params

**File**: `src/hooks/useConciergeAI.ts`

- Expand `AiCharacter` to `'default' | 'kyle' | 'beaugosse' | 'donajkiin'`
- Add spread for the new character in the fetch body: `{ character: 'donajkiin', wisdomLevel: egoLevel }`
- Reuses the existing `egoLevel` state (same as Beau Gosse reuses it as `charmLevel`)

#### 3. UI — Four-way cycle + Mayan theme

**File**: `src/components/ConciergeChat.tsx`

- Update cycle order: `['default', 'kyle', 'beaugosse', 'donajkiin']`
- When **Don Aj K'iin** is active:
  - Icon: `TreePine` or `Sun` from lucide with **emerald/green glow**
  - Header name: "Don Aj K'iin" in `emerald-400`
  - Subtitle: "Mayan Guardian 🌿"
  - Meter label: "WISDOM" (instead of EGO/CHARM)
  - Meter colors: teal → emerald → gold (nature-to-sun gradient)
  - Toast: "Don Aj K'iin activated. Mmm... sit down, hermano... let me tell you something. 🌿"
- Add `isDonAjKiin` boolean for conditional styling
- Update toggle title tooltip for the new cycle position

### Files to change

| File | Change |
|------|--------|
| `supabase/functions/ai-concierge/index.ts` | Add `buildDonAjKiinPrompt()`, new branch in `buildSystemPrompt()`, add `wisdomLevel` to opts |
| `src/hooks/useConciergeAI.ts` | Add `'donajkiin'` to type, send `wisdomLevel` in fetch body |
| `src/components/ConciergeChat.tsx` | Four-way cycle, emerald/green theme, WISDOM meter, new labels |

No changes to Kyle, Beau Gosse, or default. Pure addition.


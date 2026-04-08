

## Plan: Add "The Beau Gosse" as a Third Character Option

### What we're doing

Adding **The Beau Gosse (El Guapo)** as a new character alongside the existing **Default** and **Kyle** options. Users cycle through three personas: Default → Kyle → Beau Gosse → Default.

### Changes

#### 1. Hook — Expand character type

**File**: `src/hooks/useConciergeAI.ts`

- Change `AiCharacter` type from `'default' | 'kyle'` to `'default' | 'kyle' | 'beaugosse'`
- Send `character: 'beaugosse'` and `charmLevel` (reusing the existing `egoLevel` state) when Beau Gosse is active
- No other logic changes — ego/charm meter and sentiment detection already work

#### 2. Edge function — Add Beau Gosse persona prompt

**File**: `supabase/functions/ai-concierge/index.ts`

- Add `buildBeauGossePrompt(charmLevel)` function with the full persona from the user's spec: reactive humor engine, playful/sharp dual modes, French charm, flirt engine
- Charm level 1-3: Sharp mode (more direct, slight sarcasm)
- Charm level 4-6: Classic Beau Gosse (smooth, witty, balanced)
- Charm level 7-10: Full seduction mode (maximum charm, wordplay, flirty)
- Add `else if (opts.character === "beaugosse")` branch in `buildSystemPrompt()` — existing Kyle and default branches untouched

#### 3. UI — Three-way character toggle

**File**: `src/components/ConciergeChat.tsx`

- Change the single toggle button to cycle through: default → kyle → beaugosse → default
- When **Beau Gosse** is active:
  - Button shows `Sparkles` icon with purple glow (instead of Flame/orange)
  - Header name: "The Beau Gosse" in purple-400
  - Subtitle: "El Guapo ✨"
  - Meter label changes from "EGO" to "CHARM"
  - Meter colors: blue → purple → rose-gold (instead of blue → orange → red)
  - Toast: "The Beau Gosse activated. Let's make this interesting... ✨"
- When **Kyle** is active: everything stays exactly as it is now
- When **Default** is active: everything stays exactly as it is now

### Files to change

| File | Change |
|------|--------|
| `src/hooks/useConciergeAI.ts` | Add `'beaugosse'` to `AiCharacter` type, send character in fetch body |
| `supabase/functions/ai-concierge/index.ts` | Add `buildBeauGossePrompt()`, new branch in `buildSystemPrompt()` |
| `src/components/ConciergeChat.tsx` | Three-way cycle toggle, conditional styling/labels per character |

No changes to Kyle. No changes to default concierge. Pure addition.




## Plan: Rebrand Kyle → The Beau Gosse (El Guapo) — Full Character Overhaul

### What changes

Replace the "Kyle — Boston Hustler" persona with **"The Beau Gosse (El Guapo)"** — a charming, witty, French-flavored character with reactive humor, playful teasing, and adaptive intelligence instead of ego-driven arrogance.

### Key personality shift

| Before (Kyle) | After (Beau Gosse) |
|---|---|
| Boston street hustler | French-charming menace |
| Fillers: "bro", "you know what I mean?" | Wordplay, double meanings, light French touches |
| Ego meter (arrogance scale) | **Charm meter** (playfulness intensity) |
| Dismissive, slightly annoying | Witty, seductive, emotionally intelligent |
| Orange/fire theme | Purple/rose gold theme (French luxury feel) |

### Changes by file

#### 1. Edge function — New persona prompt

**File**: `supabase/functions/ai-concierge/index.ts`

- Rename `buildKylePrompt()` → `buildBeauGossePrompt(charmLevel)`
- Replace the entire system prompt with the user's provided persona: reactive humor engine, playful/sharp dual modes, flirt engine, French flavor
- Charm level 1-3: More direct/sharp mode, less humor
- Charm level 4-6: Classic Beau Gosse — smooth, witty, balanced
- Charm level 7-10: Full seduction mode — maximum charm, wordplay, flirty energy
- Update the `character` param check from `"kyle"` to `"beaugosse"`

#### 2. Hook — Rename types and labels

**File**: `src/hooks/useConciergeAI.ts`

- Change `AiCharacter` type from `'default' | 'kyle'` to `'default' | 'beaugosse'`
- Rename `CHARACTER_KEY` storage value handling
- Update `AGREE_PATTERN` / `CHALLENGE_PATTERN` — keep sentiment detection but rebrand as charm adjustments (agreement = charm rises, challenge = sharp mode triggers)
- Send `character: 'beaugosse'` and `charmLevel` (renamed from `egoLevel`) in fetch body

#### 3. UI — Visual rebrand

**File**: `src/components/ConciergeChat.tsx`

- Replace flame icon with a sparkle/crown/diamond icon (e.g. `Sparkles` from lucide)
- Change color scheme from orange to **purple/rose-gold** (`text-purple-400`, `bg-purple-500/20`)
- Rename "Kyle" → "The Beau Gosse" in header
- Rename "Boston Hustler" subtitle → "El Guapo ✨"
- Rename "EGO" meter label → "CHARM"
- Update meter colors: blue → purple → rose-gold (instead of blue → orange → red)
- Update toggle toasts: "The Beau Gosse activated. Let's make this interesting... ✨" / "Back to default concierge"

### Files to change

| File | Change |
|------|--------|
| `supabase/functions/ai-concierge/index.ts` | Replace Kyle prompt with Beau Gosse persona, rename function |
| `src/hooks/useConciergeAI.ts` | Rename type `kyle` → `beaugosse`, `egoLevel` → `charmLevel` semantically |
| `src/components/ConciergeChat.tsx` | Visual rebrand: purple theme, sparkle icon, charm meter, new labels |


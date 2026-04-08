

## Plan: Add "The Bot Better" + "Luna Shanti" Characters, Character Selector UI, and Fix History Dismiss

Three things to build:
1. Two new AI personas (characters 5 and 6)
2. Replace the cycle-toggle with a character selection panel inside the chat
3. Fix the conversation history sidebar to close when tapping outside

### Changes

#### 1. Edge function — Two new persona prompts

**File**: `supabase/functions/ai-concierge/index.ts`

**Add `buildBotBetterPrompt(sassLevel)`**:
- Sass 1-3: Boss Mode — focused, efficient, high-value, less playful
- Sass 4-6: Classic Bot Better — smooth confidence, light sass, charming pushback then solution
- Sass 7-10: Full Sassy Queen — maximum attitude, playful sarcasm, teasing, strong pushback before helping
- Core: stunning luxury concierge, Tulum nightlife/villa expert, signature "sass first → then solve" pattern
- Flirt engine: subtle, confident, classy. Never explicit.
- Pink/gold theme energy

**Add `buildLunaShantiPrompt(zenLevel)`**:
- Zen 1-3: Playful Mystic — fun, light astrology comments, casual spiritual references
- Zen 4-6: Classic Luna — calm, flowing, energy-reading engine, soft guidance with humor
- Zen 7-10: Deep Healer — reflective, supportive, emotional depth, breathwork/ceremony references
- Core: boho spiritual guide, yoga/breathwork/astrology, interprets user emotion as "energy"
- Astrology engine: occasionally asks zodiac sign, makes playful star-sign comments
- Teal/lavender theme energy

**Add branches** in `buildSystemPrompt()` for `"botbetter"` and `"lunashanti"`. Add `sassLevel` and `zenLevel` to opts type.

#### 2. Hook — Expand type + send params

**File**: `src/hooks/useConciergeAI.ts`

- Expand `AiCharacter` to include `'botbetter' | 'lunashanti'`
- Add fetch body spreads:
  - `botbetter` → `{ character: 'botbetter', sassLevel: egoLevel }`
  - `lunashanti` → `{ character: 'lunashanti', zenLevel: egoLevel }`

#### 3. UI — Character selector buttons + history fix

**File**: `src/components/ConciergeChat.tsx`

**Character Selector Panel** (replaces the cycle-toggle button):
- Replace the single toggle button in the header with a button that opens a character selection panel
- Panel shows 6 character buttons in a horizontal scrollable strip or grid below the header:
  - Default (Sparkles icon) — primary color
  - Kyle (Flame icon, orange)
  - Beau Gosse (Sparkles icon, purple)
  - Don Aj K'iin (Sun icon, emerald)
  - The Bot Better (Crown/Diamond icon, pink/rose-gold)
  - Luna Shanti (Moon icon, teal/lavender)
- Each button shows the character name + a small icon
- Active character is highlighted with its theme color
- Tapping a character selects it, shows the appropriate toast, and closes the panel
- Meter label adapts: EGO / CHARM / WISDOM / SASS / ZEN

**The Bot Better theme**: Pink/rose-gold colors, `Crown` or `Diamond` icon, meter label "SASS"

**Luna Shanti theme**: Teal/lavender colors, `Moon` icon, meter label "ZEN"

**History sidebar fix**: Add an overlay/backdrop behind the `ConversationSidebar` that closes it when tapped. When `sidebarOpen` is true, render a transparent touch target covering the rest of the screen that calls `setSidebarOpen(false)` on click.

### Files to change

| File | Change |
|------|--------|
| `supabase/functions/ai-concierge/index.ts` | Add `buildBotBetterPrompt()`, `buildLunaShantiPrompt()`, two new branches in `buildSystemPrompt()` |
| `src/hooks/useConciergeAI.ts` | Add `'botbetter' \| 'lunashanti'` to type, send params in fetch |
| `src/components/ConciergeChat.tsx` | Character selector UI, two new themes, sidebar dismiss-on-tap-outside |

No changes to existing characters. Pure addition.


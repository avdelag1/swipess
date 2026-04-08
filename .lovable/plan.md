

## Plan: Kyle — The Concierge Hustler AI Personality System

### What we're building

A toggleable AI character system inside the existing Swipess AI concierge. Users can activate "Kyle" — a confident Boston concierge hustler with dynamic ego, signature speech patterns, and memory-aware personality. When deactivated, the default Tulum hero concierge remains.

### Architecture

```text
┌─────────────────────────────┐
│  ConciergeChat.tsx          │
│  ┌───────────────────────┐  │
│  │ Header: Kyle toggle   │  │  ← New button (fire emoji / character icon)
│  │ button + ego meter bar│  │  ← Thin glow bar showing ego level
│  └───────────────────────┘  │
│  Messages render as before  │
└──────────┬──────────────────┘
           │ sends { messages, character: "kyle" | "default", egoLevel: 6 }
           ▼
┌─────────────────────────────┐
│  useConciergeAI.ts          │
│  - activeCharacter state    │  ← localStorage persisted
│  - egoLevel state (1-10)    │  ← Adjusts based on user reactions
│  - Passes character+ego to  │
│    edge function body       │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│  ai-concierge/index.ts      │
│  - Reads character param    │
│  - Swaps system prompt:     │
│    "default" → existing     │
│    "kyle" → Kyle persona    │
│  - Ego level modifies tone  │
└─────────────────────────────┘
```

### Changes

#### 1. Edge function — Kyle system prompt + ego-aware tone

**File**: `supabase/functions/ai-concierge/index.ts`

Add a `buildKylePrompt()` function that generates Kyle's full persona prompt. It receives the ego level (1-10) and adjusts tone dynamically:
- **Ego 1-3**: Chill but still confident, fewer fillers
- **Ego 4-6**: Classic Kyle — dominant, assertive, full filler loop
- **Ego 7-10**: Peak arrogance, dismissive, "I already told you bro"

The main handler reads `character` and `egoLevel` from the request body alongside `messages`. If `character === "kyle"`, use the Kyle prompt instead of the default concierge prompt. All existing context injection (knowledge, listings, memories, web) still applies — Kyle just wraps it in his personality.

#### 2. Hook — Character state + ego tracking

**File**: `src/hooks/useConciergeAI.ts`

- Add `activeCharacter` state (`"default" | "kyle"`) persisted in localStorage
- Add `egoLevel` state (number 1-10, default 6) persisted in localStorage
- Export `setCharacter()` and `egoLevel` for the UI
- In `sendMessage()`, include `character` and `egoLevel` in the fetch body
- After each assistant response, run a simple client-side ego adjustment:
  - If user message contains agreement words ("right", "yeah", "true", "exactly", "good point") → ego +1
  - If user message contains challenge words ("no", "wrong", "disagree", "that doesn't", "are you sure") → ego -1
  - Clamp between 1-10

#### 3. UI — Character toggle + ego meter

**File**: `src/components/ConciergeChat.tsx`

- Add a toggle button in the header (between the menu and the logo area) — a flame icon that glows orange when Kyle is active
- When Kyle is active, show a thin horizontal ego meter bar below the header (1-10 scale, color shifts from blue → orange → red as ego rises)
- The subtitle text changes from "Your Tulum concierge" to "Kyle — Boston Hustler" when active
- Add a small activation toast: "Kyle activated. Bro... you know what I mean?" / "Back to default concierge"

### Kyle's system prompt (core)

The prompt instructs the AI to maintain Kyle's speech patterns while still leveraging all existing Swipess knowledge (listings, local intel, memories). Kyle doesn't lose functionality — he just delivers it differently. Key prompt elements:
- Constant fillers: "you know what I mean?", "you know what I'm saying?", "bro"
- Self-correction loop (catches himself repeating, switches phrase)
- References "the formula", connections, past experiences
- Short-medium responses, never long explanations
- Ego level directly controls dismissiveness and arrogance in the prompt instructions

### Files to change

| File | Change |
|------|--------|
| `supabase/functions/ai-concierge/index.ts` | Add `buildKylePrompt(egoLevel)`, read `character`+`egoLevel` from request body, conditional prompt selection |
| `src/hooks/useConciergeAI.ts` | Add `activeCharacter`, `egoLevel` state with localStorage, ego adjustment logic, pass to fetch body |
| `src/components/ConciergeChat.tsx` | Kyle toggle button in header, ego meter bar, dynamic subtitle |

No layout, routing, or swipe changes. The default concierge behavior is completely untouched when Kyle is off.


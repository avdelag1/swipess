

## AI Orchestrator System -- Unified Multi-Task Intelligence

### What We're Building

A single `ai-orchestrator` edge function that replaces the current `ai-assistant` and `ai-conversation` functions, handling all AI tasks through one entry point with provider fallback support.

### Current State

- `ai-assistant` handles: listing generation, profile enhancement, search
- `ai-conversation` handles: conversational listing builder
- Both use Lovable AI Gateway with `google/gemini-3-flash-preview`
- Frontend hooks: `useAIGeneration` and `useConversationalAI`
- MiniMax API key is stored but has no balance (fallback only)

### Architecture

```text
[ Frontend ]
     |
     |-- useAIGeneration() -----> listing, profile, search, enhance
     |-- useConversationalAI() -> conversation (listing builder)
     |
     v
[ supabase.functions.invoke("ai-orchestrator") ]
     |
     |  task routing + provider selection
     |
     |---> Lovable AI Gateway (default, free)
     |---> MiniMax (fallback, if key has balance)
     |
     v
[ Normalized JSON Response ]
     |
     v
[ Form Autofill / Search Filters / Enhanced Text ]
```

### Tasks Supported

1. **listing** -- Generate structured listing data from description + category
2. **profile** -- Enhance user bio and interests
3. **search** -- Convert natural language query to structured filters (semantic search)
4. **enhance** -- Improve existing listing/profile text
5. **conversation** -- Multi-turn conversational listing builder with memory

### Changes

#### 1. New Edge Function: `supabase/functions/ai-orchestrator/index.ts`

Single file that:
- Accepts `{ task, data, context, messages }` payload
- Routes to the correct prompt builder based on `task`
- Calls Lovable AI Gateway (primary) with fallback to MiniMax if Lovable fails
- Parses AI response into structured JSON
- Handles rate limit errors (429) and payment errors (402) with clear messages
- Returns normalized `{ result, provider_used }` response

Provider logic is inline (no subfolders -- edge functions require single file). The orchestrator tries Lovable AI first; if it returns 429/500, it attempts MiniMax as fallback (if the key exists and has balance).

#### 2. Update `supabase/config.toml`

Register `ai-orchestrator` with `verify_jwt = false`. Keep old functions registered for backward compatibility during transition.

#### 3. Update Frontend Hooks

**`src/hooks/ai/useAIGeneration.ts`**
- Change invoke target from `ai-assistant` to `ai-orchestrator`
- Add `enhance` task type support
- Surface rate limit / payment errors as toast messages

**`src/hooks/ai/useConversationalAI.ts`**
- Change invoke target from `ai-conversation` to `ai-orchestrator`
- Send `task: "conversation"` with messages array

**`src/components/AIListingAssistant.tsx`**
- Update the direct `supabase.functions.invoke('ai-assistant')` call to use `ai-orchestrator`

#### 4. Add AI Enhance Capability

New export in `useAIGeneration`:
- `enhance(text, tone)` method that sends `task: "enhance"` to the orchestrator
- Returns improved text that user must confirm before applying

#### 5. AI Semantic Search

The existing `search` task already converts natural language to structured filters. The orchestrator will improve the prompt to also detect language and return richer intent data:
```text
Input:  "clean lady near me under 1000"
Output: { category: "worker", filters: { keywords: ["cleaning"], max_price: 1000 }, language: "en", suggestion: "..." }
```

No new database queries needed -- the AI only structures intent, and the existing frontend filter logic applies the result.

### Files to Create/Modify

1. **Create** `supabase/functions/ai-orchestrator/index.ts` -- unified orchestrator with all task routing and provider fallback
2. **Modify** `supabase/config.toml` -- add orchestrator function registration
3. **Modify** `src/hooks/ai/useAIGeneration.ts` -- point to orchestrator, add enhance task
4. **Modify** `src/hooks/ai/useConversationalAI.ts` -- point to orchestrator
5. **Modify** `src/components/AIListingAssistant.tsx` -- point to orchestrator

### Provider Fallback Logic

```text
1. Try Lovable AI Gateway (free, fast)
2. If 429/500 -> Try MiniMax (if MINIMAX_API_KEY exists)
3. If both fail -> Return error with clear message
```

### What Stays the Same

- All existing frontend UI components remain unchanged
- The swipe mechanics, filters, and database schema are untouched
- The conversational listing builder flow stays identical
- All existing AI capabilities (listing, profile, search) work exactly as before, just routed through the new orchestrator


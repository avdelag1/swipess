

# Fix AI System + Runtime Errors

## Problems

1. **AI orchestrator uses only MiniMax** — which is failing with "invalid api key (2049)". The function has zero fallback to the Lovable AI Gateway despite `LOVABLE_API_KEY` being available.

2. **Runtime errors in `useScrollBounce.ts`** — The selectors `> div, > button` and `> button` are invalid for `querySelectorAll`. They need the `:scope` prefix (`:scope > div, :scope > button`).

3. **MiniMax API key is stale** — The user provided a new key that needs to be updated.

---

## Changes

### 1. Update MiniMax API Key
Use the `add_secret` tool to set the new MiniMax API key the user provided.

### 2. Rewrite `ai-orchestrator` with Lovable AI Gateway as Primary
**File: `supabase/functions/ai-orchestrator/index.ts`**

- **Primary**: Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) using `LOVABLE_API_KEY` with model `google/gemini-3-flash-preview`
- **Fallback**: MiniMax (existing logic) only if gateway fails
- Keep all existing task routing, agentic loop, context gathering, and system prompt intact
- Add proper error handling for 429 (rate limit) and 402 (credits) from the gateway
- Surface clear error messages back to the client

### 3. Fix `querySelectorAll` Runtime Error
**File: `src/hooks/useScrollBounce.ts`**

Change line 57 and line 192 to prefix selectors with `:scope`:
```typescript
container.querySelectorAll(`:scope ${childSelector}`)
// This makes '> div, > button' valid by scoping it
```

Wait — actually `:scope > button` is valid but the simpler fix is to just wrap with `:scope ` prefix only when the selector starts with `>`. Or better: change the default and callers to use `:scope` consistently.

Simplest fix: In `useScrollBounce`, wrap the querySelectorAll calls:
```typescript
const scopedSelector = childSelector.startsWith('>') ? `:scope ${childSelector}` : childSelector;
container.querySelectorAll(scopedSelector);
```

### 4. Deploy Edge Function
Deploy the updated `ai-orchestrator` after changes.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/ai-orchestrator/index.ts` | Add Lovable AI Gateway as primary provider, MiniMax as fallback |
| `src/hooks/useScrollBounce.ts` | Fix invalid CSS selectors with `:scope` prefix |

## Result
- AI will use the fast, reliable Lovable AI Gateway by default (no API key issues)
- MiniMax serves as automatic fallback if gateway is down
- Runtime `querySelectorAll` errors eliminated
- All existing AI features (concierge chat, search, listing assistant, conversational AI) work through the same robust orchestrator


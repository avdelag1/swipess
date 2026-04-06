

# Fix AI Chat — Root Cause Found + MiniMax Primary

## The Bug (Confirmed)

The network capture shows the smoking gun:

```text
Request: POST undefined/functions/v1/ai-orchestrator
Headers:
  apikey: undefined
  authorization: Bearer undefined
```

The **ping** works because it uses `supabase.functions.invoke()` (which reads the URL from the initialized client). But the **chat** call uses `import.meta.env.VITE_SUPABASE_URL` directly via raw `fetch` — and that env var is resolving to `undefined` in the preview runtime. So the chat request goes to `undefined/functions/v1/ai-orchestrator`, which hits the app's own HTML page, returning `<!DOCTYPE html>` instead of JSON — hence the error: `Unexpected token '<'`.

## Fix Plan (2 changes)

### 1. Frontend: Switch chat call to `supabase.functions.invoke()`

**File:** `src/hooks/useConciergeAI.ts` (lines 165-196)

Replace the raw `fetch` with `supabase.functions.invoke('ai-orchestrator', { body: payload })` — the exact same pattern the ping already uses successfully. This eliminates the `undefined` URL problem entirely because the Supabase client already has the correct URL configured.

### 2. Backend: MiniMax primary, Lovable AI fallback

**File:** `supabase/functions/ai-orchestrator/index.ts`

Update the edge function to:
1. Try MiniMax first using the `MINIMAX_API_KEY` secret (OpenAI-compatible endpoint at `https://api.minimaxi.chat/v1/chat/completions`)
2. If MiniMax fails (auth error, timeout, etc.), fall back to Lovable AI gateway
3. Log which provider was used for debugging

Then redeploy the function.

### 3. Update MiniMax API key

Use the secret tool to update `MINIMAX_API_KEY` with the new key you provided (`sk-cp-884UMyEXo3k400H8oLOzMUQIUWReSoWpuwt1MMjAUYewLe21v-Ul5dVVCMr9eAxVg5J-xiJ1xa6iDT37Myyd8l-_aPQa7xTh4zUKr-QxwahTOGN4j1g4f7g`).

## Expected Result

- Chat requests route through the correct backend URL (no more `undefined`)
- MiniMax generates responses as primary provider
- If MiniMax ever fails, Lovable AI kicks in as backup
- Messages persist to database and survive reloads


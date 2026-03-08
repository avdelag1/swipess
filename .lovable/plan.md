

# Fix AI Orchestrator — MiniMax Integration

## Root Cause

The MiniMax API endpoint URL in `supabase/functions/ai-orchestrator/index.ts` is **wrong**:
- Current: `https://api.minimax.io/v1/chat/completions`
- Correct: `https://api.minimaxi.chat/v1/chat/completions`

This means every MiniMax call silently fails (likely DNS error or 404), and if Gemini also fails, the user sees "Oracle is silent" with no AI working.

Additionally, the model `MiniMax-Text-01` is outdated — MiniMax has released `MiniMax-M2.5` (March 2026 flagship) which is significantly more capable.

## Changes

### File: `supabase/functions/ai-orchestrator/index.ts`

1. **Fix endpoint URL** (line 50): Change from `https://api.minimax.io/v1/chat/completions` to `https://api.minimaxi.chat/v1/chat/completions`

2. **Upgrade model** (line 51): Change from `MiniMax-Text-01` to `MiniMax-M2.5` (current flagship, better at JSON output and reasoning)

3. **Add better error logging** in `callMinimax`: Log the full URL being called so future debugging is easier

That's it — two-line fix plus minor logging improvement. No other files need changes. The fallback logic, auth, prompts, and client-side code are all correct.


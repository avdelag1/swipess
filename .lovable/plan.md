

## Plan: Show AI Provider Label Below Messages & Make MiniMax Primary

### What changes

1. **Swap provider priority** — The edge function currently tries Lovable AI (Gemini) first and falls back to MiniMax. We reverse this: MiniMax first, Gemini as fallback.

2. **Return provider name from backend** — Add a custom SSE header (`X-AI-Provider: minimax` or `X-AI-Provider: gemini`) to the streaming response so the frontend knows which model answered. For non-streaming responses, include `provider` in the JSON body.

3. **Surface provider in the frontend** — Extend the `ChatMessage` type with an optional `provider` field. The `useConciergeAI` hook reads the header from the response and attaches it to the assistant message. `ConciergeChat.tsx` renders a small subtle label below each AI bubble (e.g., "Powered by MiniMax" or "Powered by Gemini") with a tiny icon/badge.

### Files to modify

- **`supabase/functions/ai-concierge/index.ts`** — Swap try/catch order (MiniMax first, Lovable AI fallback). Add `X-AI-Provider` header to the returned streaming response.
- **`src/hooks/useConciergeAI.ts`** — Read `X-AI-Provider` header from fetch response, store it on the assistant `ChatMessage`.
- **`src/components/ConciergeChat.tsx`** — Render a small provider label below assistant message bubbles.

### Visual design

Below each AI bubble, a subtle line in `text-[10px] text-muted-foreground/40`:
```
⚡ Powered by MiniMax
```
or
```
⚡ Powered by Gemini
```

Minimal, non-intrusive, matches the existing timestamp style.


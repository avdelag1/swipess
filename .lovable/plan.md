

# Fix AI Chat — Strip MiniMax `<think>` Tags + Ensure Published Site Works

## What Happened

After adding the Tavily API key, MiniMax M2.7 started returning `<think>...</think>` reasoning blocks in its streaming output. The browser renders these as invisible HTML elements, making AI responses appear as **empty bubbles**. The actual answer text comes after `</think>`, but during streaming it looks blank until the thinking phase finishes — and even then, ReactMarkdown can swallow the tags.

The backend is fully functional (confirmed via direct API test — returns full responses). This is purely a **frontend rendering issue**.

## Changes

### 1. Strip `<think>` blocks from AI responses (src/hooks/useConciergeAI.ts)

Add a `stripThinkingTokens` helper that removes `<think>...</think>` blocks from streamed content in real-time:

```typescript
function stripThinkingTokens(text: string): string {
  // Remove completed <think>...</think> blocks
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  // Remove incomplete <think>... (still streaming)
  cleaned = cleaned.replace(/<think>[\s\S]*$/g, '').trim();
  return cleaned;
}
```

Apply this in three places:
- **Streaming token callback**: Clean the accumulated `fullText` before updating the message state
- **Stream completion callback**: Clean `fullText` before passing to `extractAction`
- **JSON fallback**: Clean `rawText` before processing

### 2. Strip `<think>` on the edge function side too (supabase/functions/ai-orchestrator/index.ts)

In `handleJSON`, strip `<think>` blocks from MiniMax response text before returning. This ensures non-streaming responses are also clean:

```typescript
// After extracting text from MiniMax
text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
```

### 3. Redeploy edge function

Deploy `ai-orchestrator` with the server-side fix.

## About the Published Site

The backend (edge function) deploys automatically and is already live. The **frontend** fix from the previous message (fixing the `/undefined/` URL) requires you to click **Publish → Update** in the Lovable dashboard. This plan's frontend changes will also need publishing after implementation.

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useConciergeAI.ts` | Add `stripThinkingTokens()`, apply to streaming + JSON paths |
| `supabase/functions/ai-orchestrator/index.ts` | Strip `<think>` blocks in `handleJSON` before returning |


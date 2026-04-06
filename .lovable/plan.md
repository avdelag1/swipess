

# Fix AI Chat: Messages Disappearing + Explain AI Choice

## What's Actually Happening (Diagnosis)

The AI **is working**. I verified it live — the backend returns real, intelligent answers about Tulum dining, properties, etc. The network request I captured shows a full response with proper content. The problem is twofold:

1. **Assistant messages are not being saved to the database.** Looking at the `ai_messages` table, recent assistant responses have **empty content** or are missing entirely. This means when you reload the chat or switch conversations, only your messages appear — the AI answers vanish.

2. **The non-streaming response path doesn't persist to DB.** In `useConciergeAI.ts`, the streaming path (lines 310-328) has DB persistence code, but the non-streaming fallback path (lines 335-353) **does not save the assistant message to the database at all**. Since the backend returns `Content-Type: application/json` (not `text/event-stream`), the code always takes the non-streaming path — which skips persistence.

## Why Lovable AI Instead of MiniMax

To clarify: **Lovable AI does NOT consume your development credits.** It's a separate AI gateway service included with Lovable Cloud. Your development credits are for building the app with me (the editor). Lovable AI is for powering features *inside* your app (like the concierge chat). They are completely separate.

I switched from MiniMax because:
- The MiniMax API key you provided was returning authentication errors (invalid/expired)
- Lovable AI uses a pre-configured `LOVABLE_API_KEY` that's always available — no key management needed
- It uses Google Gemini under the hood, which provides high-quality responses
- It has its own usage allowance (separate from your dev credits)

If you'd prefer to use MiniMax, we'd need a valid API key. I can switch back once you confirm the key works.

## Fix Plan

### 1. Add DB persistence to the non-streaming response path
In `useConciergeAI.ts`, after the assistant message is added to state (around line 351), add the same DB persistence logic that exists in the streaming path:

```ts
// After setMessages(prev => [...prev, assistantMsg]);
if (user && convId) {
  await supabase.from('ai_messages').insert({
    conversation_id: convId,
    user_id: user.id,
    role: 'assistant',
    content: aiText,
    metadata: aiAction ? { action: aiAction } : {}
  });
  await supabase.from('ai_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', convId);
}
```

### 2. Fix the `convId` scoping issue
The `convId` variable is declared inside the streaming block's scope but needs to be accessible in the non-streaming path too. Move the conversation creation logic before the fetch call so both paths can use it.

### 3. Clean up stale empty messages from DB
The old broken assistant messages with empty content pollute the conversation history on reload. Add a filter when loading messages to skip empty ones:

```ts
// When loading messages from DB, filter out empty assistant messages
.filter(m => m.content && m.content.trim() !== '')
```

## Files to Edit

| File | Change |
|------|--------|
| `src/hooks/useConciergeAI.ts` | Add DB persistence to non-streaming path, fix convId scope, filter empty messages on load |

## Expected Result
- AI responses persist across page reloads
- Conversation history shows both user and assistant messages
- No more "disappearing" answers




# Rebuild AI Concierge — Full-Featured Chat on Your Backend

## The Problem

The edge function `ai-concierge` deploys to the Lovable Cloud project (`qegyisokrxdsszzswsqk`), but `supabase.functions.invoke()` uses the client from `client.ts` which points to your production project (`vplgtcguxujxwrgguxqq`). This means the AI call currently fails silently or hits a 404.

Additionally, the chat is missing key features: conversation memory, resend, markdown rendering, and proper per-message actions.

## Plan

### 1. Fix Edge Function Call Path

The hook (`useConciergeAI.ts`) currently uses `supabase.functions.invoke('ai-concierge')` which routes to `vplgtcguxujxwrgguxqq` (your production project where the function doesn't exist). Will switch to a direct `fetch()` call using `import.meta.env.VITE_SUPABASE_URL` which points to the Lovable Cloud project where the edge function actually deploys. This is the only way to reach the function while keeping your production database on `vplgtcguxujxwrgguxqq`.

### 2. Update Edge Function — MiniMax + Lovable AI Fallback

Update `supabase/functions/ai-concierge/index.ts`:
- Fix the Lovable AI gateway URL to the correct one: `https://ai.gateway.lovable.dev/v1/chat/completions`
- Keep MiniMax-M2.7 as primary, Lovable AI (`google/gemini-3-flash-preview`) as fallback
- Add SSE streaming support for real-time token delivery
- Proper error handling with 429/402 status codes surfaced to the client
- Your MINIMAX_API_KEY is already configured as a secret

### 3. Upgrade `useConciergeAI` Hook — Streaming + Conversations

Rewrite `src/hooks/useConciergeAI.ts`:
- **SSE streaming**: Token-by-token rendering using the pattern from the AI gateway docs
- **Conversation memory**: Support multiple conversations stored in localStorage, each with a unique ID, title (auto-generated from first message), and timestamp
- **Active conversation switching**: Ability to load previous conversations
- **Resend**: Expose a `resendMessage(messageId)` function that removes everything after that message and re-sends it
- **No fake fallbacks**: Real errors shown as toasts, never saved as assistant messages

### 4. Rebuild `ConciergeChat.tsx` — Premium Full-Featured UI

Rewrite `src/components/ConciergeChat.tsx` with:

**Header area:**
- SwipesS AI branding (Sparkles icon, no MiniMax anywhere)
- Conversation list toggle (slide-out panel showing past conversations)
- New conversation button
- Clear history (trash icon)
- Close button

**Message bubbles:**
- Full timestamp on every message: date + hour:minute
- Markdown rendering for assistant messages (using `react-markdown`)
- Per-message action bar (visible on tap/hover):
  - **Copy** — copies content only (no branding)
  - **Resend/Reload** — re-sends the user message, regenerates the AI response
- Streaming text animation for incoming tokens
- No provider branding inside or below bubbles

**Input area:**
- Auto-expanding textarea
- Send button (disabled when empty or loading)
- Keyboard shortcut: Enter to send, Shift+Enter for newline

**Empty state:**
- Welcome message with suggestion chips
- Premium design following the luxury doctrine

**Conversation sidebar (slide-out):**
- List of past conversations with title + date
- Tap to switch conversation
- Delete individual conversations

### 5. Add `react-markdown` Dependency

Install `react-markdown` for proper AI response rendering with formatting support.

### 6. No Other File Changes

The `modalStore.ts`, `GlobalDialogs.tsx`, and `BottomNavigation.tsx` already have the AI chat wired up correctly from the previous rebuild. No changes needed there.

## Files Changed

| File | Action |
|------|--------|
| `supabase/functions/ai-concierge/index.ts` | Update: SSE streaming, fix gateway URL |
| `src/hooks/useConciergeAI.ts` | Rewrite: streaming, conversations, resend |
| `src/components/ConciergeChat.tsx` | Rewrite: full-featured premium UI |
| `package.json` | Add: `react-markdown` dependency |

## Technical Details

- **Primary model**: MiniMax-M2.7 (your API key, already in secrets)
- **Fallback**: google/gemini-3-flash-preview via Lovable AI gateway
- **Edge function URL**: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-concierge`
- **Auth header**: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
- **Storage**: localStorage with conversation-level organization (up to 20 conversations, 50 messages each)


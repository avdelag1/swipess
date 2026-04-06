

# Fix AI Chat Responses, Scroll, Input Speed & Auto-Scroll

## Root Causes Found

### 1. AI Not Replying — Broken Timeout + No Real Abort
The `useSentientChat` hook creates an `AbortController` with a 25-second timeout, but **never passes it to the fetch call**. `supabase.functions.invoke` does not accept an AbortController. So:
- If MiniMax hangs, the request hangs forever
- The "timeout" fires but does nothing — the UI stays stuck on "Thinking..."
- No actual cancellation happens

Additionally, the `useSentientChat` hook uses `stream: false` which means only the JSON path runs on the backend. If MiniMax fails silently and the Lovable fallback also has an issue, the user gets nothing.

### 2. Chat History Window Not Scrollable
The `ConversationHistoryPopover` uses `ScrollArea` with `max-h-52` (208px) which is correct, but the history view inside `AISearchDialog` (the "Conversation Vault") uses `overflow-y-auto` directly — this should work but may be clipped by the parent `overflow-hidden` on the `DialogContent`.

### 3. Input Feels Slow
The `handleSend` callback depends on `[query, isSearching, isTyping, messages, user, clientProfile, sendMessage]` — every time `messages` changes (which is every token during streaming in other contexts), the callback re-creates. The `disabled={!query.trim() || isSearching || isTyping}` on the Send button causes a re-render evaluation on every keystroke. The `AnimatePresence` wrapping chat/history view adds mounting overhead.

### 4. No Auto-Scroll to Bottom on Chat Open
The auto-scroll effect fires on `[messages, isTyping, isOpen]` with `behavior: 'smooth'` — this creates a visible animation delay. When opening an existing conversation, the user should instantly see the latest message without a scroll animation.

---

## Plan

### 1. Fix AI Reply — Replace `supabase.functions.invoke` with Direct Fetch + Real Abort
**File**: `src/hooks/ai/useSentientChat.ts`

- Replace `supabase.functions.invoke` with a direct `fetch()` call (same pattern as `callAiOrchestrator` in `useConciergeAI`)
- Pass the `AbortController.signal` to the fetch so the 25s timeout actually cancels the request
- If JSON response has no text content, throw an error to trigger retry/fallback
- Strip `<think>` tokens from the response (currently not done in this hook)

### 2. Fix Chat History Scrolling
**File**: `src/components/AISearchDialog.tsx`

- The history view (`view === 'history'`) container has `overflow-y-auto` but is inside `AnimatePresence` + `motion.div` which may interfere. Add explicit `min-h-0` to the motion container to ensure flex overflow works correctly.
- The main chat message area also needs `min-h-0` on its flex parent to allow proper overflow scrolling.

### 3. Speed Up Input Responsiveness
**File**: `src/components/AISearchDialog.tsx`

- Move the `disabled` check for the Send button into a derived variable so it doesn't re-evaluate inside JSX
- Remove `AnimatePresence mode="wait"` — this delays view transitions. Use simple conditional rendering with CSS opacity transitions instead
- Remove individual `motion.div` wrappers on each message bubble — these add mount animations for every message. Use CSS `@keyframes` for the latest message only.

### 4. Instant Scroll to Bottom on Open + New Messages
**File**: `src/components/AISearchDialog.tsx`

- On dialog open: use `behavior: 'instant'` (not 'smooth') for the initial scroll — user should see the latest message immediately
- On new message arrival: keep `behavior: 'smooth'` for the live-typing feel
- Add a separate `useEffect` for initial open vs ongoing messages:
  ```
  // Instant on open
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [isOpen]);
  
  // Smooth on new messages
  useEffect(() => {
    if (isOpen && messages.length > 0) 
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);
  ```

### 5. Focus Input Immediately
**File**: `src/components/AISearchDialog.tsx`

- Reduce the `setTimeout` for `inputRef.current?.focus()` from 300ms to 50ms — the dialog animation completes quickly
- Add `autoFocus` to the textarea as a backup

---

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/ai/useSentientChat.ts` | Direct fetch with real AbortController, `<think>` stripping, empty-response detection |
| `src/components/AISearchDialog.tsx` | Fix scroll containers, instant scroll-to-bottom on open, faster input focus, remove animation overhead |


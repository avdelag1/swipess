

# Fix AI Chat: Diagnose and Resolve the Repeating Error Message

## Root Cause Analysis

I verified the edge function is **deployed and alive** — the ping returns `200 OK` with both Gemini and MiniMax configured. However, when calling the `chat` task without authentication, it returns `401 Unauthorized` (which is correct behavior).

The "same message" the user keeps seeing is almost certainly this error fallback in `AISearchDialog.tsx`:

> *"I'm having a brief moment of silence while I reconnect with my data sources. 💎✨"*

This appears every time the actual AI call fails, and the generic catch block hides the real error.

**Likely failure causes (in order of probability):**

1. **Supabase URL mismatch**: The `client.ts` fallback URL points to project `vplgtcguxujxwrgguxqq` (old project), but the Cloud project where edge functions are deployed is `qegyisokrxdsszzswsqk`. If `.env` doesn't properly override this, all function calls go to the wrong project.

2. **User not authenticated**: The edge function requires a valid Bearer token (lines 450-456). If the user isn't logged in, every chat call returns 401 and triggers the generic error message.

3. **Silent error swallowing**: The catch block in `AISearchDialog.tsx` shows a friendly but useless message instead of the actual error, making debugging impossible.

## Plan

### 1. Add detailed error logging and user-facing error messages
**File: `src/components/AISearchDialog.tsx`**
- In the catch block, extract the actual error message (401 = "Please log in first", 429 = "Rate limit", 402 = "Credits exhausted", etc.)
- Show the real error to the user instead of the generic "moment of silence" message
- Add `console.error` with full error details

### 2. Add authentication guard to AI chat
**File: `src/components/AISearchDialog.tsx`**
- Check if user is authenticated before sending messages
- Show "Please sign in to use the AI assistant" if not logged in
- Import `useAuth` hook

### 3. Add a fallback direct fetch for function calls
**File: `src/components/AISearchDialog.tsx`**
- If `supabase.functions.invoke` fails with a network error, try calling the Cloud project URL directly as a diagnostic step
- Log which URL the Supabase client is hitting

### 4. Redeploy edge function (already done)
The `ai-orchestrator` function has been freshly deployed during this investigation.

## Summary of File Changes

| File | Change |
|------|--------|
| `src/components/AISearchDialog.tsx` | Add auth guard, improve error handling with specific messages, add debug logging |
| `src/pages/AITestPage.tsx` | Add auth guard check |


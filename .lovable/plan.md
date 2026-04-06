
Goal: fully restore real AI chat so the concierge answers the user’s actual question with MiniMax-backed responses, not a canned fallback.

What I verified
- The frontend is reaching the correct backend function URL. Network requests go to the current backend project, not the old one.
- The ping call works: `{"status":"ready"}`.
- The actual chat call returns HTTP 200, but the body is a generic reply:
  `{"result":{"text":"I'm here! What can I help you with? 🦎","action":null},"status":"success"}`
- That canned reply does not exist in the current repo code I inspected.
- The deployed backend logs for `ai-orchestrator` show a different implementation is running in production: it is still trying Gemini and failing with `API key expired`.
- The current repo’s `supabase/functions/ai-orchestrator/index.ts` is MiniMax-based, but the live backend behavior/logs do not match that file.

Most likely root cause
- The live backend function is out of sync with the repo and is still serving an older/stale AI orchestrator.
- There is also a frontend/backend contract mismatch: `useConciergeAI.ts` sends `stream: true`, but the observed response is plain JSON, not a real stream.
- Result: the app appears to “think”, then falls back into a generic auto-reply instead of returning a real model answer.

Fix plan
1. Replace the live backend with one single source of truth
- Redeploy `ai-orchestrator` so the deployed function matches the repo version.
- Remove any old Gemini fallback logic from the live function path for concierge chat.
- Keep MiniMax as the only active provider for this flow, per your requirement.

2. Normalize the backend response contract
- Make the concierge route use one stable response mode only.
- Best immediate fix: use non-streaming JSON for the concierge chat, since the project memory already says this flow was stabilized with `stream: false`.
- Ensure the backend always returns a predictable shape like:
  `result.text`, optional `result.action`, and real error messages on failure.

3. Align the frontend hook with that contract
- Update `src/hooks/useConciergeAI.ts` so it stops requesting streaming for concierge chat.
- Use the backend function invocation path consistently instead of mixing streaming fetch behavior with JSON fallback behavior.
- Remove the “thinking but no answer” ambiguity by handling:
  - success with real text
  - backend error with visible error
  - empty response with explicit failure message, not a fake concierge reply

4. Eliminate the hidden canned-response path
- Find and remove the fallback branch that is generating `I'm here! What can I help you with?`
- Since that string is not in the current repo, I would specifically inspect the deployed function version / stale proxy path and any compatibility wrappers around `ai-orchestrator`.

5. Verify end-to-end with real prompts
- Test with prompts that prove model reasoning is live, for example:
  - “Best tacos in Tulum and why?”
  - “Give me 3 options by vibe and budget”
- Confirm the response is query-specific, not generic.
- Confirm backend logs no longer mention Gemini expired-key errors.
- Confirm network response contains MiniMax-generated content and not the canned message.

Files/areas to fix
- `supabase/functions/ai-orchestrator/index.ts`
- `src/hooks/useConciergeAI.ts`
- Possibly proxy wrappers if they still point to stale logic:
  - `supabase/functions/ai-assistant/index.ts`
  - `supabase/functions/ai-conversation/index.ts`

Important security note
- Do not paste API keys or backend tokens in chat again.
- I do not need the pasted secrets from your message for the fix plan; the backend already has stored secrets configured.
- The issue is not “missing key in the repo”; it is that the live AI function behavior does not match the code you expect.

Expected result after implementation
- The concierge will answer the actual user question.
- No more fake auto-replies.
- No more Gemini-expired log noise on the live concierge path.
- Frontend and backend will use one stable, matching protocol instead of mixed streaming/JSON behavior.

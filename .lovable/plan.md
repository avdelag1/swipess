
Goal: fix the broken AI reply flow immediately, change the browser title away from “Speed of Light Discovery,” and unblock the current build.

What I found:
- The website title is hardcoded in `index.html` as `Swipess | Speed of Light Discovery`.
- The build is currently broken in `src/pages/Index.tsx` because `lazy` and `Suspense` are used but not imported.
- The AI chat issue is not just cosmetic now: the request is reaching the backend, but the streaming response can return a MiniMax error payload inside an SSE `200` response:
  `status_msg: "your current token plan not support model, MiniMax-Text-01"`.
- The frontend `useConciergeAI` currently treats any SSE response as success, so that provider error becomes a blank/non-answer instead of triggering fallback.

Implementation plan:

1. Fix the build first
- Update `src/pages/Index.tsx` to import `lazy` and `Suspense` from React.
- Keep the lazy-loaded landing page, just make the file compile again.

2. Change the website/browser title
- Update `index.html` title from `Swipess | Speed of Light Discovery` to a more deal-focused message.
- Best fit based on your request and current brand tone:
  `Swipess | Find Your Best Deal`
- If needed, I can also tune related empty-state copy later so the product feels more consistent.

3. Fix AI streaming failure handling in `src/hooks/useConciergeAI.ts`
- Harden the SSE parser so it detects provider-side error payloads inside `data:` chunks, not only normal token deltas.
- If the stream contains:
  - `status_msg`
  - `error`
  - no usable token content
  then treat streaming as failed instead of successful.
- Return `false` from `attemptStreaming()` in those cases so the hook automatically falls back to JSON mode.

4. Make the JSON fallback actually recover
- Preserve the current fallback path in `useConciergeAI`, but ensure it runs when stream startup is “fake-success.”
- Surface a human-readable error only if both streaming and JSON fail.
- Avoid saving blank assistant messages to chat history.

5. Harden the backend provider fallback in `supabase/functions/ai-orchestrator/index.ts`
- In `handleStreaming`, detect MiniMax “unsupported plan / unsupported model” responses before proxying them to the client.
- If MiniMax returns an error body or non-token SSE payload, do not pass that stream through as success.
- Immediately fall back to the secondary AI provider for streaming.
- Keep the existing `<think>` sanitization intact.

6. QA after implementation
- Verify build passes again.
- Verify the browser title shows the new wording.
- Test the AI chat end-to-end with a simple prompt like “Hello” and a property query to confirm:
  - no blank bubble
  - response text appears
  - fallback works when MiniMax is unavailable
  - chat history stores real assistant text only

Files to update:
- `index.html`
- `src/pages/Index.tsx`
- `src/hooks/useConciergeAI.ts`
- `supabase/functions/ai-orchestrator/index.ts`

Technical notes:
- Root cause of AI failure: provider-plan/model mismatch being returned as a streamed SSE error payload with HTTP 200, which bypasses normal `response.ok` checks.
- Root cause of build failure: missing named React imports after introducing lazy loading.
- Lowest-risk fix: add stream error detection + provider fallback rather than redesigning the chat UI.

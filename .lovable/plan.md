

## Plan: Fix Countdown Flicker + Change to 3s + Speed Optimizations

### Problem
1. **Countdown flickers** — appears, disappears at second 2, then reappears. Root cause: `onresult` calls `clearCountdown()` which kills the timer, but `onend` fires shortly after and restarts recognition, which triggers new `onresult` events from the same speech, restarting the silence timer. This creates a race condition loop.
2. **Countdown should be 3 seconds** (currently 5).
3. **AI replies still slow** — `wrapStreamForCapture` re-creates the entire response with a new `ReadableStream`, adding overhead. Also, the `max_tokens: 350` can be reduced further and system prompt context gathering has room for optimization.

### Changes

**File 1: `src/components/ConciergeChat.tsx`**

- Change `COUNTDOWN_SECONDS` from 5 to **3**
- **Fix the flicker bug**: The core issue is that `clearCountdown()` is called inside `onresult`, which clears the silence timer AND the countdown interval. But during a countdown, recognition is still running and can fire stale `onresult` events. Fix:
  - Add a `isCountingDown` ref that is set to `true` when countdown starts
  - In `onresult`: only clear countdown if new *final* transcript content has changed (user actually spoke new words), not on every interim event
  - In `onend`: do NOT restart recognition if `isCountingDown` is true — let the countdown finish undisturbed
  - Stop recognition when countdown starts (no more stale events)
- Remove `countdown` from `startListening`'s dependency array (it captures stale state in the closure — this is a major bug causing the flicker)

**File 2: `supabase/functions/ai-concierge/index.ts`**

- Reduce `max_tokens` from 350 to **280** for both MiniMax and Gemini (faster streaming, still enough for concise responses)
- Skip `wrapStreamForCapture` for unauthenticated users (already done) — for authenticated users, make the capture non-blocking by using `tee()` on the stream instead of re-reading chunks, which avoids adding latency to each chunk delivery
- Skip `searchWeb` entirely when local knowledge or listings are found (don't even start the fetch — saves network time in the parallel `Promise.all`)

### UX Flow (unchanged)
```
User stops speaking → 2s silence → countdown 3…2…1 → 🚀 Ignition! → sends
```


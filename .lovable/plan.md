

## Plan: Make AI Concierge Responses Shorter Across All Personas

### Problem
All persona responses are too long and redundant. Kyle especially repeats filler phrases excessively. The prompts encourage verbosity and there's no global brevity constraint.

### Changes

**1. Add a global brevity directive injected into every persona prompt**

A short block prepended to all system prompts (default + all 5 characters) that enforces concise responses:

```
RESPONSE LENGTH RULES (OVERRIDE ALL OTHER STYLE RULES):
- Default: 1-3 sentences. Maximum 4 sentences only when listing data.
- Never repeat the same idea twice in different words.
- One joke/filler per response, not three.
- Get to the point, then stop. No recap, no summary, no "let me know".
- If the user asks a simple question, give a simple answer.
```

This goes into `buildSystemPrompt()` so it wraps every persona.

**2. Reduce `max_tokens` from 1024 to 450**

In both `streamLovableAI()` and `streamMiniMax()`. This hard-caps response length at the model level — even if the prompt leaks, the model physically can't produce walls of text.

**3. Trim redundant style encouragements in each persona**

- **Kyle**: Remove the 5 tone examples (they teach the model to be verbose). Keep 1 example. Remove the line encouraging constant filler usage — change to "use fillers sparingly, 1-2 per response max".
- **Beau Gosse**: Reduce humor frequency from "60-70% of responses" to "40%". Remove 1 of 3 tone examples.
- **Don Aj K'iin**: Keep cultural depth but add "express wisdom in one sentence, not a paragraph".
- **Bot Better**: Add "sass in one line, then solve in one line".
- **Luna Shanti**: Add "one insight, one action. No spiritual essays."
- **Default**: Already says "2-4 short sentences" — tighten to "2-3 sentences max".

### Files Modified

1. **`supabase/functions/ai-concierge/index.ts`** — All changes in this single file:
   - Add global brevity block in `buildSystemPrompt()`
   - Reduce `max_tokens` in both streaming functions
   - Trim verbose examples in each `build*Prompt()` function

### Expected Impact
- Response length: ~60% shorter on average
- Token usage: ~50% reduction per response
- Streaming speed: responses complete faster
- Character personality: preserved, just tighter


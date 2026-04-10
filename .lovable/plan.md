

## Plan: Make AI Concierge Smarter and More Context-Aware

### Problems Found

1. **Severely capped intelligence**: `max_tokens: 280` on both MiniMax and Gemini. This is roughly 2-3 sentences maximum — the AI literally cannot think or respond with any depth. It gets cut off mid-thought constantly.

2. **Persona prompts block thinking**: Every persona (Kyle, Beau Gosse, Bot Better, Ezriyah, etc.) has aggressive brevity rules stacked on top of global brevity rules. The AI gets: time context → brevity override ("1-3 sentences MAX") → persona prompt ("2-4 sentences") → memories → knowledge → listings. The brevity rules override everything and make it feel dumb because it can't elaborate.

3. **Persona prompts lack intelligence directives**: The personas define *personality* but never tell the AI to actually *think*, *reason*, or *analyze*. There's no instruction to use the context intelligently — just style rules. Kyle says "Act like you ALREADY know the answer" which literally tells the AI to skip reasoning.

4. **Web search rarely triggers**: Web search only fires when ALL of knowledge, listings, AND profiles return empty. So if even one knowledge base entry matches (even poorly), the AI never gets fresh web data.

5. **Memory context is thin**: Memories are loaded as flat one-liners (`[category] title: content`) with no instruction on how to USE them proactively.

### Changes

**File: `supabase/functions/ai-concierge/index.ts`**

1. **Increase `max_tokens` from 280 to 800** on both MiniMax and Gemini providers. This lets the AI actually complete its thoughts while still keeping responses concise via prompt instructions.

2. **Upgrade the brevity rules to intelligence rules**:
   - Replace the harsh "1-3 sentences" override with: "Be concise but complete. Default 2-5 sentences. Simple questions get simple answers. Complex questions get thorough answers. Never cut yourself off mid-thought."
   
3. **Add a universal intelligence directive** prepended to ALL personas:
   ```
   ## THINKING RULES
   - Analyze the user's message carefully. Understand what they REALLY need.
   - Use ALL context provided (memories, knowledge, listings, web data) to give informed answers.
   - Connect dots between what you remember about the user and what they're asking now.
   - If you have relevant memories about the user, reference them naturally.
   - Give specific, actionable answers. Never vague generalities.
   - If you don't know something, say so — don't make up facts.
   ```

4. **Upgrade memory injection** from flat text to a structured instruction:
   ```
   ## What I remember about you (USE THIS — reference naturally):
   {memories}
   INSTRUCTION: Actively use these memories. If the user asks about apartments and you remember their budget, factor it in without being asked.
   ```

5. **Fix web search trigger**: Change from "only when ALL local data is empty" to "when knowledge returned fewer than 2 results AND no listings matched":
   ```typescript
   const needsWeb = (!knowledge || knowledge.split('---').length < 2) && !listings;
   const webResults = needsWeb ? await searchWeb(lastUserMessage) : "";
   ```

6. **Add reasoning instruction to each persona** — append a short block to every persona builder that says "Despite your personality, always provide genuinely useful information. Your character is HOW you deliver, not a reason to be unhelpful."

### What This Fixes
- AI will no longer cut itself off mid-sentence (280 → 800 tokens)
- AI will actually reason about user context instead of just pattern-matching personality
- Memories will be actively referenced in responses
- Web search will supplement thin local knowledge
- All personas (Kyle, Beau Gosse, Don Aj K'iin, Bot Better, Luna Shanti, Ezriyah, Brother) get the intelligence upgrade while keeping their unique character


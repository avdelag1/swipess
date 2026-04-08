

## Plan: Add Ezriyah Suave as AI Character + Featured Local Expert

Two things to build: (1) Ezriyah as a selectable chat persona, and (2) his profile seeded into the knowledge base so the default AI can surface him when relevant.

---

### 1. Add "Ezriyah" Character to the Persona System

**`src/hooks/useConciergeAI.ts`**
- Add `'ezriyah'` to the `AiCharacter` type union
- Add `ezriyahLevel` parameter handling in the `sendMessage` body (similar to other characters)

**`src/components/ConciergeChat.tsx`**
- Add Ezriyah to `CHARACTER_OPTIONS` array:
  - Key: `ezriyah`
  - Label: "Ezriyah Suave"
  - Subtitle: "Manbodiment Coach 🧘‍♂️"
  - Color: teal/amber theme (warm grounded energy)
  - Meter label: "FLOW"
  - Toast: "Ezriyah activated. Brother… let's integrate. 🔥"
- Add `isEzriyah` boolean for any character-specific styling

**`supabase/functions/ai-concierge/index.ts`**
- Add `buildEzriyahPrompt(flowLevel: number)` function with the full master prompt from your spec — the playful big-brother coach style, "brother/aloha/tranquilo" vocabulary, expertise in breathwork/mushrooms/manbodiment/conscious relationships
- Three intensity tiers: LOW (chill mentor), MID (classic embodied coach), HIGH (full fire motivator)
- Wire it into `buildSystemPrompt()` with `opts.character === "ezriyah"`
- Include his contact info (IG @epic_ezriyah, website ezriyah.com, email) so the AI naturally shares them

### 2. Seed Ezriyah Into Knowledge Base (for Default AI)

- Insert a record into the `concierge_knowledge` table with:
  - **Title**: "Ezriyah Suave — Embodied Masculinity Coach"
  - **Category**: "wellness" or "local_expert"
  - **Content**: Summary of his services (Manbodiment, Mantorship, breathwork, mushroom ceremonies, dance/movement healing, conscious relationships, men's retreats)
  - **Tags**: masculinity, coach, breathwork, mushrooms, plant medicine, dance, embodiment, men's work, healing, ceremonies
  - **Contact**: IG, website, email
- This ensures that even when using the default SwipesS AI character, questions about masculinity coaching, breathwork, plant medicine, etc. will pull Ezriyah's info from the knowledge base automatically

### 3. Edge Function Redeployment

- Redeploy `ai-concierge` with the new `buildEzriyahPrompt` function

---

### Technical Details

- The character system follows an established pattern: type union in `useConciergeAI.ts` → UI option in `ConciergeChat.tsx` → prompt builder + routing in the edge function
- Knowledge base seeding uses the existing `concierge_knowledge` table that `searchKnowledge()` already queries
- No new tables or migrations needed — just one data insert + code changes across 3 files


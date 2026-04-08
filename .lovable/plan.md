

## Plan: Upgrade System Prompt + Populate Knowledge Base

### What we're doing

1. **Replace the system prompt** in `supabase/functions/ai-concierge/index.ts` — swap the current generic Tulum prompt in `buildSystemPrompt()` with the new "hero surfer-businessman" persona. The user's draft is solid; minor tweaks: tighten formatting, ensure it references the knowledge base search and user memories correctly, keep token count lean.

2. **Populate `concierge_knowledge` table** with ~20-25 entries covering:
   - **Beach clubs** (Ziggy's, RosaNegra, Taboo, La Zebra, Bagatelle, Kanan, Gitano, Casa Malca, Nomade, KA'AN, Papaya Playa Project, La Eufemia, etc.) — each with zone, vibe, min spend, IG handle, contact info, website
   - **Real estate zones** (Aldea Zama pricing/ROI, Beach Zone, La Veleta, Region 15, Tulum Centro)
   - **Legal essentials** (fideicomiso, notario, foreign buyer rules — with directive to connect users to app's Legal section)
   - **Party/events** (full moon at PPP, DJ nights, Tulum.party as source)

3. **Deploy updated edge function** and verify it works.

### Technical details

| Change | Location |
|--------|----------|
| Replace `buildSystemPrompt()` system prompt text | `supabase/functions/ai-concierge/index.ts` lines 226-258 |
| Insert ~25 knowledge entries | `concierge_knowledge` table via insert tool |
| Deploy edge function | `ai-concierge` |

**System prompt changes**: The new prompt is more personality-driven ("hero concierge, surfer-businessman, 15+ years in Tulum"), adds explicit directives for proactive suggestions, legal section routing, beach club expertise, and bilingual tone. The structural wrapper (memories, knowledge, listings, web results injection) stays the same.

**No frontend changes needed** — the chat UI already renders markdown and handles the streaming correctly.


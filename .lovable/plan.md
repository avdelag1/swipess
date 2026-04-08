

## Plan: Rebrand AI to Tulum Expert + Fix Header Logo

### What we're doing

1. **Fix chat header branding** — Replace the plain "SwipesS AI" text with the actual `SwipessLogo` component (which has the proper uppercase S styling). Use a small size variant so it fits the header naturally.

2. **Rebrand AI from Lisbon → Tulum** — Update all Lisbon references across the system:
   - **Edge function system prompt**: Change "Lisbon, Portugal" → "Tulum, Mexico". Update currency from € to MXN/$. Update language defaults to include Spanish prominently. Remove Lisbon-specific rules (neighborhoods, visa references).
   - **Tavily web search**: Change append string from "Lisbon Portugal" → "Tulum Mexico".
   - **Chat UI text**: Update subtitle from "Your Lisbon concierge" → "Your Tulum concierge". Update welcome message and suggestion chips to Tulum-relevant topics (best beaches, cenotes, real estate zones, etc.).

3. **Clear old Lisbon knowledge data** — Delete the ~32 existing `concierge_knowledge` entries (all Lisbon-specific neighborhoods, visa, transport, etc.) to prepare for Tulum data in the next prompt.

4. **Prepare knowledge ingestion system** — The existing `concierge_knowledge` table and `searchKnowledge()` function already work well. When you send the Tulum data in the next prompt, it will be inserted into this table with proper categories (neighborhoods, beaches, restaurants, services, etc.) so the AI can reference it instantly without web searches.

### Technical details

| Change | File |
|--------|------|
| Import SwipessLogo, replace header text | `src/components/ConciergeChat.tsx` |
| Update subtitle, welcome text, suggestion chips | `src/components/ConciergeChat.tsx` |
| Rebrand system prompt to Tulum expert | `supabase/functions/ai-concierge/index.ts` |
| Update Tavily search context | `supabase/functions/ai-concierge/index.ts` |
| Update memory extraction examples | `supabase/functions/ai-concierge/index.ts` |
| Delete old Lisbon knowledge entries | Database operation |
| Deploy updated edge function | Deployment |

The knowledge vault architecture stays the same — it is already built to handle categorized entries with titles, content, URLs, and tags. The next prompt with Tulum data will populate it directly.


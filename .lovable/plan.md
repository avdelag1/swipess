
# SwipesS AI Intelligence Upgrade

## Overview

Transform the AI concierge from a basic chatbot into a context-aware, knowledge-backed assistant that searches real listings, remembers users, and learns over time.

---

## 1. Listing Search — AI queries your real listings

**What**: When a user asks "find me a 2-bedroom in Alfama under €1200", the AI searches the `listings` table and returns real results with links.

**How**: 
- Add a `search-listings` helper in the edge function that queries `listings` via Supabase client
- Keyword extraction from user message → SQL filter (category, price range, bedrooms, location/neighborhood)
- Returns top 5 matching listings formatted with title, price, location, and a deep link (`/listing/{id}`)
- Results injected into the AI system prompt as context before generating the response

**Edge function changes**: Add Supabase client initialization, listing search logic, and inject results into prompt.

---

## 2. User Memory — Remember preferences across sessions

**What**: AI remembers things like "I need pet-friendly", "my budget is €900", "I'm moving in July" and uses them automatically in future conversations.

**How**:
- Create a `user_memories` table (already exists in schema? will check) with columns: `user_id`, `memory_key`, `memory_value`, `category`, `created_at`, `updated_at`
- Edge function loads user memories at conversation start and adds them to system prompt
- After each AI response, extract any new facts using structured output (tool calling) and upsert into `user_memories`
- Categories: `preference`, `timeline`, `budget`, `location`, `lifestyle`

**Database changes**: Create `user_memories` table with RLS policies.

---

## 3. Knowledge Vault — Populate `concierge_knowledge` with Lisbon data

**What**: Pre-load the existing `concierge_knowledge` table with verified Lisbon information so the AI gives accurate, link-backed answers.

**How**:
- Bulk insert ~30-50 knowledge entries covering:
  - **Neighborhoods**: Alfama, Graça, Baixa, Príncipe Real, Santos, Estrela, Mouraria, etc. (descriptions, vibes, avg prices)
  - **Practical info**: D7 visa, NIF process, utilities setup, transport cards, health insurance
  - **Cost of living**: Rent ranges, groceries, dining, transport costs
  - **Services**: Where to find plumbers, electricians, movers, internet providers
- Each entry includes `website_url`, `google_maps_url`, and `tags` for semantic matching
- Edge function queries `concierge_knowledge` by matching user query keywords against `title`, `content`, and `tags`

**Database changes**: Insert knowledge data using the insert tool.

---

## 4. Auto-Learn from Conversations — Extract & store facts

**What**: After each conversation turn, the AI identifies useful facts ("user prefers furnished apartments", "user has a dog") and saves them for future reference.

**How**:
- After the main AI response streams, fire a non-blocking background extraction call
- Use tool calling to extract structured facts: `{ key: "has_pet", value: "dog", category: "lifestyle" }`
- Upsert into `user_memories` — same key updates rather than duplicates
- On next conversation, these memories are loaded into the system prompt

**Edge function changes**: Add a post-response extraction step (non-blocking).

---

## 5. Updated Edge Function Architecture

The `ai-concierge` edge function will follow this flow:

```
1. Receive user message
2. Load user memories from `user_memories` table
3. Search `concierge_knowledge` for relevant entries (keyword match)
4. Search `listings` table if query looks like a listing search
5. (If needed) Search web via Tavily for fresh info
6. Build enriched system prompt with all context
7. Stream AI response to user
8. (Background) Extract new facts → upsert into user_memories
```

---

## Files Changed

| File | Action |
|------|--------|
| `supabase/functions/ai-concierge/index.ts` | Major update: add listing search, knowledge query, memory load/save |
| Database migration | Create `user_memories` table with RLS |
| Database insert | Populate `concierge_knowledge` with ~30-50 Lisbon entries |

## Technical Notes

- Listing search uses the Supabase service role key (already available as `SUPABASE_SERVICE_ROLE_KEY` secret) to query listings
- User memories are scoped by `user_id` with RLS
- Knowledge matching uses PostgreSQL `ILIKE` and array overlap on tags
- Deep links format: the AI will output markdown links like `[View listing](/listing/{id})`
- For unauthenticated users, the AI still works but without memory/listing personalization

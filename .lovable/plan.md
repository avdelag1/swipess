
# Upgrade Swipess AI Concierge — Expert Mode

## What You're Getting

A fully upgraded AI concierge that: speaks any language the user writes in, knows everything about the app and Tulum, generates clickable Google Maps itinerary routes, links to real places with phone numbers, learns from an admin-managed knowledge base, and responds faster with streaming.

---

## Plan (5 Parts)

### 1. Create `concierge_knowledge` Table (Admin Knowledge Base)

A new database table where you (and admins) can add curated local knowledge — FAQs, venue info, free beach entrances, restaurant recommendations, Google Maps links, phone numbers, etc. The AI will query this table before every response to ground its answers in real, verified data.

**Table structure:**
- `id`, `category` (e.g. "beaches", "restaurants", "transport", "faq", "app_help")
- `title`, `content` (the actual knowledge text)
- `google_maps_url`, `phone`, `website_url` (optional structured data)
- `tags[]`, `language` (default "en", supports "es", "zh", etc.)
- `is_active` (admin can toggle entries on/off)
- `created_by` (admin user_id)

RLS: All authenticated users can read active entries. Only admins can insert/update/delete.

### 2. Upgrade Edge Function System Prompt + Knowledge Injection

**File: `supabase/functions/ai-orchestrator/index.ts`**

Major changes:
- **Query `concierge_knowledge`** at the start of every chat request. Pull the top 10-15 most relevant entries (filtered by category/tags matching the user's query) and inject them into the system prompt as grounding context.
- **Multilingual instruction**: Add to system prompt: *"Always respond in the same language the user writes in. If they write in Chinese, respond in Chinese. If Spanish, respond in Spanish."*
- **Google Maps + itinerary**: Instruct the AI to always include Google Maps links when recommending places. When building itineraries, use a structured `create_itinerary` action with Google Maps URLs per stop.
- **Proactive behavior**: Instruct the AI to ask follow-up questions, offer to send the route, suggest alternatives, and remember preferences.
- **App navigation**: Include a map of all app routes/pages so the AI can direct users (e.g., "Go to Properties → tap the filter icon").
- **Increase `max_tokens` to 2048** for richer itinerary responses.

### 3. Streaming Responses (Instant Feel)

**Files: `ai-orchestrator/index.ts` + `useConciergeAI.ts` + `ConciergeChat.tsx`**

Switch from synchronous JSON to **SSE streaming** so tokens appear as the AI types them:

- **Edge function**: When `stream: true`, pipe the MiniMax/Lovable AI stream directly back as `text/event-stream`.
- **Hook**: Use `fetch` with `ReadableStream` reader, parse SSE line-by-line, and update the assistant message content progressively via `setMessages`.
- **UI**: The existing `ReactMarkdown` rendering will naturally update as content grows. The "thinking" indicator shows only until the first token arrives.

This gives the "instant" feel — you see the first word within ~200ms instead of waiting 3-5 seconds for the full response.

### 4. Richer Action Cards (Google Maps Routes)

**File: `ConciergeChat.tsx`**

Add a new action card type `show_route` that renders:
- A list of stops with Google Maps links (clickable, opens in new tab)
- Phone numbers as clickable `tel:` links
- Distance/time estimates between stops (if the AI provides them)
- A "Send me the full route" button that copies all Google Maps links

The existing `create_itinerary` card will be enhanced to include Google Maps links per activity.

### 5. In-App Navigation Links

**File: `ai-orchestrator/index.ts` (system prompt)**

Add a route map to the system prompt so the AI can generate in-app navigation actions:

```
App pages: /client/dashboard, /properties, /properties/:id, /events, /profile, /settings, /messages
```

New action type `navigate_to` that the frontend handles by calling `navigate(path)` — so the AI can say "Let me take you to the properties page" and it actually navigates.

---

## Files to Change

| File | Change |
|------|--------|
| **Migration SQL** | Create `concierge_knowledge` table + RLS policies |
| `supabase/functions/ai-orchestrator/index.ts` | Knowledge query, multilingual prompt, streaming, richer system prompt, increased max_tokens |
| `src/hooks/useConciergeAI.ts` | SSE streaming parser, progressive message updates |
| `src/components/ConciergeChat.tsx` | Google Maps route cards, `navigate_to` action handler, enhanced itinerary cards |

## Expected Results
- AI responds in the user's language automatically
- Answers grounded in admin-curated local knowledge (no hallucinated phone numbers)
- Clickable Google Maps links in itineraries and recommendations
- First token appears in ~200ms (streaming)
- AI proactively asks follow-ups and offers to build routes
- Admins can update knowledge without touching code

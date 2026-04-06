

# Implementation: Swipess AI Concierge Expert Mode

## Summary
Upgrading the AI concierge with: admin knowledge base, multilingual responses, SSE streaming for instant feel, Google Maps route cards, in-app navigation, and proactive behavior.

## Step 1: Database Migration — `concierge_knowledge` table

Create table for admin-managed local knowledge (FAQs, venues, beaches, restaurants):

```sql
CREATE TABLE public.concierge_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  content text NOT NULL,
  google_maps_url text,
  phone text,
  website_url text,
  tags text[] DEFAULT '{}',
  language text NOT NULL DEFAULT 'en',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: All authenticated can read active entries. Only admins can insert/update/delete (using `has_role()`).

## Step 2: Edge Function — `ai-orchestrator/index.ts`

Full rewrite with these additions:
- **Knowledge injection**: Query `concierge_knowledge` table using service role key, inject matched entries into system prompt
- **Multilingual prompt**: "ALWAYS respond in the SAME LANGUAGE the user writes in"
- **Streaming support**: When `stream: true` in payload, pipe SSE stream directly from MiniMax/Lovable AI to client
- **Richer system prompt**: Budget planning, Google Maps links, app navigation map, proactive follow-ups
- **Increased `max_tokens`**: 1024 → 2048 for richer itinerary responses
- **New action types**: `show_route`, `navigate_to`, enhanced `create_itinerary` with Google Maps URLs
- **Rate limit handling**: Return proper 429/402 errors

## Step 3: Frontend Hook — `useConciergeAI.ts`

Add SSE streaming support alongside existing JSON path:
- Send `stream: true` in payload
- Use `fetch()` with the full Supabase functions URL for streaming (can't use `supabase.functions.invoke` for streams)
- Parse SSE line-by-line: extract `delta.content` tokens
- Update assistant message progressively via `setMessages`
- Show thinking indicator only until first token arrives
- Fall back to JSON path if streaming fails
- Handle `navigate_to` action by calling `window.location` or exposing a callback

## Step 4: Chat UI — `ConciergeChat.tsx`

- **Route card**: New `show_route` action renders a list of stops with clickable Google Maps links, phone numbers as `tel:` links, and a "Copy all links" button
- **Enhanced itinerary**: Add `google_maps_url` per activity as clickable map pins
- **Navigate action**: Handle `navigate_to` by calling `navigate(path)` and closing the chat dialog
- **Instant feel**: Streaming already handles this — first token shows within ~200ms

## Files Changed

| File | Change |
|------|--------|
| Migration SQL | New `concierge_knowledge` table + RLS + indexes |
| `supabase/functions/ai-orchestrator/index.ts` | Knowledge query, multilingual, streaming, richer prompt |
| `src/hooks/useConciergeAI.ts` | SSE streaming parser, progressive rendering |
| `src/components/ConciergeChat.tsx` | Route cards, navigate_to handler, enhanced itinerary |


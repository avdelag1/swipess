

## Plan: Fix Chat UX Issues and Knowledge Search

### Issue Summary

1. **Auto-send toggle location** — Currently above the input area; move it inside the chat input section (inline with the input bar)
2. **Placeholder branding** — "Ask SwipesS AI..." → "Ask Swipes..." (first letter uppercase, rest lowercase)
3. **Copy/Resend buttons disappearing** — The action buttons use `sm:opacity-0 sm:group-hover:opacity-100` which makes them invisible on mobile after initial render; fix to always be visible
4. **Textarea doesn't grow with text** — Currently fixed `rows={1}` with no auto-resize; implement auto-growing textarea capped at 50% viewport height
5. **AI doesn't find Ezriyah** — The `searchKnowledge()` function fetches only 5 random rows from 25 total entries with NO keyword filtering in the SQL query. Ezriyah's entry is in the DB but gets missed. Need to add ILIKE filters to the query.

---

### Changes

**File: `src/components/ConciergeChat.tsx`**

1. **Placeholder**: Change `"Ask SwipesS AI..."` → `"Ask Swipes..."`

2. **Auto-growing textarea**: Add an `useEffect` that auto-resizes the textarea based on content. Reset height to `auto`, then set to `scrollHeight`, capped at `50vh`. Replace the static `max-h-32` with a dynamic `maxHeight` style.

3. **Copy/Resend always visible**: Change the action bar classes from `opacity-100 sm:opacity-0 sm:group-hover:opacity-100` to always `opacity-100` (or a subtler approach: keep them at reduced opacity but always visible, e.g., `opacity-60 hover:opacity-100`).

4. **Auto-send toggle moved inline**: Move the auto-send toggle button from its own row above the input into the input bar row itself (next to the mic button), making it more compact and integrated.

**File: `supabase/functions/ai-concierge/index.ts`**

5. **Fix knowledge search**: Update `searchKnowledge()` to use ILIKE keyword filtering in the SQL query instead of fetching 5 random rows and scoring client-side. Build an `.or()` filter from keywords matching against `title`, `content`, and `category` columns, and increase the limit to 10 to ensure relevant entries like Ezriyah are found.

```sql
-- Current (broken): fetches 5 random active rows
SELECT ... FROM concierge_knowledge WHERE is_active = true LIMIT 5

-- Fixed: filters by keywords in SQL
SELECT ... FROM concierge_knowledge 
WHERE is_active = true 
AND (title ILIKE '%men%' OR content ILIKE '%men%' OR title ILIKE '%coach%' OR content ILIKE '%coach%' ...)
LIMIT 10
```

Also add Ezriyah as a "Local Legend" reference in the default persona's system prompt so the AI always knows to recommend him for men's coaching, breathwork, and holistic healing queries — even if the knowledge search returns nothing.


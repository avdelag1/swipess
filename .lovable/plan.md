
## Fix Messaging Errors + Redesign Messaging UI

### Root Cause of "Failed to check existing conversations"

The `conversations` table only has 4 columns: `id`, `match_id`, `created_at`, `updated_at`. But the code references columns that do not exist: `client_id`, `owner_id`, `listing_id`, `status`, `last_message_at`, `free_messaging`.

Similarly, `conversation_messages` uses `content` (not `message_text`) and `read_at` (not `is_read`).

The `matches` table uses `user_id` (not `client_id`).

Every messaging query fails because of these column mismatches.

### Fix Strategy

**Part 1: Database Migration -- Add missing columns to conversations**

Add the columns the code expects to the `conversations` table:

```sql
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS owner_id uuid,
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS free_messaging boolean DEFAULT false;

-- Make match_id nullable (conversations can exist without a match)
ALTER TABLE public.conversations
  ALTER COLUMN match_id DROP NOT NULL;

-- Drop the unique constraint on match_id so multiple conversations can share a match
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_match_id_key;
```

**Part 2: Fix conversation_messages column references**

The table has `content` but code uses `message_text`, and has `read_at` but code uses `is_read`. Add aliases:

```sql
ALTER TABLE public.conversation_messages
  ADD COLUMN IF NOT EXISTS message_text text,
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- Backfill from existing columns
UPDATE public.conversation_messages SET message_text = content WHERE message_text IS NULL;
UPDATE public.conversation_messages SET is_read = (read_at IS NOT NULL) WHERE is_read IS NULL;
```

**Part 3: Fix matches table references**

Some code uses `client_id` on matches but the column is actually `user_id`. Rather than adding a column, fix the code references in these files:
- `src/lib/swipe/SwipeQueue.ts` -- change `client_id` to `user_id`
- `src/lib/realtimeManager.ts` -- change `client_id` to `user_id`
- `src/hooks/useClientStats.tsx` -- change `client_id` to `user_id`

**Part 4: Add RLS policies for conversations**

Enable proper access control so authenticated users can create and read their own conversations:

```sql
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE POLICY "Users can update their own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = owner_id);
```

**Part 5: Messaging UI Redesign**

Update `MessagingDashboard.tsx` conversation list with a modern, clean design:
- Larger avatars with gradient ring indicators
- Cleaner conversation preview cards with subtle glassmorphism
- Better typography hierarchy (name bold, preview muted, timestamp subtle)
- Unread message dot indicator
- Smooth hover/press animations
- Remove the duplicate stats badge that appears twice
- Clean up the overall spacing and visual rhythm to feel premium and iOS-native

Update `MessagingInterface.tsx` chat view:
- Simplify the header (remove redundant info rows)
- Better message input area with rounded pill-style input
- Smoother message bubble animations
- Cleaner empty state

### Files to modify

1. **Database migration** (new) -- Add missing columns + RLS policies
2. `src/hooks/useConversations.tsx` -- No changes needed (already uses the column names we are adding)
3. `src/hooks/useDirectMessageListing.ts` -- No changes needed
4. `src/hooks/useMarkMessagesAsRead.tsx` -- No changes needed (uses is_read which we are adding)
5. `src/hooks/useUnreadMessageCount.tsx` -- No changes needed
6. `src/lib/swipe/SwipeQueue.ts` -- Fix `client_id` to `user_id` for matches table
7. `src/lib/realtimeManager.ts` -- Fix `client_id` to `user_id` for matches table
8. `src/hooks/useClientStats.tsx` -- Fix `client_id` to `user_id` for matches table
9. `src/pages/MessagingDashboard.tsx` -- UI redesign
10. `src/components/MessagingInterface.tsx` -- UI cleanup

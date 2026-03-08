

# Audit Findings: Critical Bugs Still Present

## Bug 1: Unread Message Count Always Shows 0 (CRITICAL)

`useUnreadMessageCount.tsx` is completely broken. It:

1. Queries the `matches` table filtering by `client_id` — but the `matches` table has NO `client_id` column (it uses `user_id` and `owner_id`). This query silently returns empty results.
2. Then tries to find conversations via `match_id` — but most conversations have `match_id = null` (it's nullable and often unset).
3. Result: unread message badge is **always 0**. Users never see they have unread messages.

**Fix**: Rewrite to query `conversations` directly (where user is `client_id` or `owner_id`), then count unread `conversation_messages` in those conversations. No need to go through `matches` at all.

## Bug 2: Duplicate Conversation Creation on Match Detection

In `useSwipeWithMatch.tsx` line 509-517, the `conversations.upsert()` call doesn't specify `onConflict`. With the new unique index on `(client_id, owner_id)` added in the last migration, if a match is detected but a conversation already exists, this will throw a unique constraint violation instead of gracefully upserting.

**Fix**: Add `onConflict: 'client_id,owner_id'` to the upsert, or use an insert-with-select-first pattern.

## Bug 3: Missing `update_conversation_timestamp` Trigger

The `update_conversation_timestamp()` function exists in the database but has **no trigger attached** (confirmed: 0 triggers in the database). The code manually updates `last_message_at` in `useSendMessage` and `useStartConversation`, but this is fragile — any message inserted via realtime or other paths won't update the timestamp. The conversation list sorting by `last_message_at` may be stale.

**Fix**: Create a trigger on `conversation_messages` AFTER INSERT that fires `update_conversation_timestamp()`. Remove the manual `last_message_at` updates from hooks (or keep them for optimistic behavior).

## Files Modified

1. **`src/hooks/useUnreadMessageCount.tsx`** — Complete rewrite: query conversations directly by `client_id`/`owner_id`, count unread messages without going through matches table.

2. **`src/hooks/useSwipeWithMatch.tsx`** — Fix conversation upsert to handle the unique constraint on `(client_id, owner_id)` by catching duplicate errors gracefully or using proper onConflict.

3. **DB Migration** — Add trigger on `conversation_messages` AFTER INSERT to call `update_conversation_timestamp()`.

## What This Does NOT Change
- Swipe UI, messaging UI, design — untouched
- Notification system — working correctly after last fix
- Like/unlike logic — working correctly
- Content moderation — working correctly


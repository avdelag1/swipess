

# Frontend-Backend Integrity Audit & Fixes

## Critical Bugs Found

### Bug 1: Notifications for Other Users Silently Fail
The `notifications` table INSERT RLS policy enforces `auth.uid() = user_id`, meaning you can only insert notifications for **yourself**. But `useSwipeWithMatch.tsx` inserts notifications for OTHER users (the person being liked). These inserts silently fail — no one ever receives like/match notifications.

**Affected flows:**
- Owner likes a client → client never gets notified (line 190)
- Client likes a listing → owner never gets notified (line 270)
- `useLikeNotificationActions` → reciprocal match notification fails (line 109)
- `SwipeQueue.ts` → like notifications fail (line 244)

**Fix:** Create a `SECURITY DEFINER` database function `create_notification_for_user` that bypasses RLS, then call it via `supabase.rpc()` instead of direct inserts. This is the correct pattern for cross-user notifications.

### Bug 2: Mark Messages As Read Silently Fails
The `conversation_messages` UPDATE RLS policy is `sender_id = auth.uid()` — you can only update messages YOU sent. But `useMarkMessagesAsRead` updates messages where `sender_id != user.id` (marking the other person's messages as read). This means **messages are never marked as read**, and unread counts never decrease.

**Fix:** Update the RLS UPDATE policy to also allow participants to update `is_read`/`read_at` on messages in their conversations: `(sender_id = auth.uid()) OR is_conversation_participant(auth.uid(), conversation_id)`.

### Bug 3: No Unique Constraint on Conversations
`useStartConversation` checks for existing conversations via a query, but there's no database-level unique constraint preventing duplicate conversations between the same two users. Under race conditions, duplicates can be created.

**Fix:** Add a unique index on `conversations(client_id, owner_id)` or use an upsert pattern. Since listing_id may vary, the simplest fix is a partial unique index or handling duplicates gracefully in the query (already partially done with the `or` check).

## Non-Critical Issues Found

### Issue 4: `likes` table SELECT policy is self-only
The `likes` SELECT policy is `auth.uid() = user_id` — users can only see their own likes. This is correct for privacy, but `useOwnerListingLikes` and `useOwnerInterestedClients` query likes by OTHER users (to see who liked your listings). These queries return empty results.

**Fix:** Add a SELECT policy allowing users to see likes on their own listings/profile:
```sql
CREATE POLICY "Users can see likes on their listings"
ON public.likes FOR SELECT
USING (
  target_id IN (SELECT id FROM public.listings WHERE owner_id = auth.uid())
  OR target_id = auth.uid()
);
```

### Issue 5: Rating system works but `useCanReviewListing` doesn't enforce conversation requirement
The plan says "rate after they communicate" — currently anyone can rate any listing regardless of whether they've had a conversation. This is a minor policy gap, not a blocker.

## Implementation Plan

### Database Migration (1 migration file)
1. Create `create_notification_for_user` SECURITY DEFINER function
2. Update `conversation_messages` UPDATE RLS to allow marking messages as read
3. Add SELECT policy on `likes` for listing owners and profile targets

### Code Changes
1. **`src/hooks/useSwipeWithMatch.tsx`** — Replace `supabase.from('notifications').insert()` with `supabase.rpc('create_notification_for_user', {...})` for cross-user notifications
2. **`src/hooks/useLikeNotificationActions.tsx`** — Same RPC replacement
3. **`src/components/NotificationSystem.tsx`** — Same RPC replacement for cross-user notifications (self-notifications can stay as direct inserts)
4. **`src/lib/swipe/SwipeQueue.ts`** — Same RPC replacement

### What This Does NOT Change
- Swipe physics, UI, design — untouched
- Conversation creation flow — works correctly
- Like/unlike flow — works correctly
- Review submission — works correctly
- Messaging within conversations — works correctly (INSERT policy is fine)


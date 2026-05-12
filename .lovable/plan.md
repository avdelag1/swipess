# Make Chat Work Everywhere

## Problem

Several places in the app expose a "Message" button, but only a subset actually create a conversation in Supabase and navigate to `/messages?conversationId=…`. Concretely:

- **Roommate Matching** (`src/pages/RoommateMatching.tsx`) imports `MessageConfirmationDialog` and tracks `messageDialogOpen`, but **never renders the dialog**. Tapping the message button does nothing visible.
- A few card surfaces fire `onMessage` callbacks that bubble up but never reach `useStartConversation`.
- Working flows already exist (`SwipessSwipeContainer`, `ClientWhoLikedYou`, `OwnerInterestedClients`, `ClientLikedProperties`, `ClientWorkerDiscovery`) — they call `useStartConversation` correctly. We use them as the reference pattern.

The backend itself (`conversations`, `conversation_messages`, RLS via `is_conversation_participant`, realtime, `useStartConversation`, `useConversations`, `useRealtimeChat`) is in place. The bug is purely in the **frontend wiring** at message entry points.

## Goal

Every button or affordance that means "talk to this person" must:
1. Resolve the target user id (and optional `listing_id`).
2. Open a confirmation dialog (or send directly where appropriate).
3. Call `useStartConversation` which finds-or-creates the row in `conversations` and inserts the first row in `conversation_messages`.
4. Navigate to `/messages?conversationId=<id>` so `MessagingDashboard` opens that thread.

## Scope of fixes (frontend only)

### 1. Roommate Matching — actually mount the dialog
File: `src/pages/RoommateMatching.tsx`
- Render `<MessageConfirmationDialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen} … />` near `MatchOverlay`.
- Provide `recipientName`, `recipientId = topCard.user_id`, and an `onConfirm(message)` handler that calls `useStartConversation().mutateAsync({ otherUserId: topCard.user_id, initialMessage: message, canStartNewConversation: true })`, then `navigate('/messages?conversationId=' + id)`.
- Disable the message button while no `topCard` is present.

### 2. Audit all "message" affordances and route them through one helper
- Add a tiny hook `useOpenChatWith(userId, listingId?)` in `src/hooks/useOpenChatWith.ts` that wraps `useStartConversation` + navigation + error toast. This becomes the single source of truth and prevents future drift.
- Replace ad-hoc copies in `ClientWhoLikedYou`, `OwnerInterestedClients`, `ClientLikedProperties`, `ClientWorkerDiscovery`, `OwnerLikedClients`, `OwnerViewClientProfile`, `PublicListingPreview`, `LikeNotificationActions`, `LikedClients`, `EventoDetail`, `DiscoverySidebar`, `MatchCelebration`/`MatchCelebrateModal`, `NotificationsDialog`, and the swipe containers to call this hook. Keep their existing dialogs; just centralize the create+navigate step.

### 3. Confirm passive realtime is mounted globally
- Verify `useLikesRealtime` and unread-count subscription are mounted once at `RootProviders` / `App` so badges update without a manual reload. Add if missing. (No backend change.)

### 4. Quick UX guards
- If `user` is not authenticated → route to `/auth` instead of silently failing.
- If `topCard.user_id === user.id` → disable the button (don't allow messaging yourself).
- Surface the existing `appToast.error` on failure so users see why it didn't open.

## Out of scope

- No schema / RLS changes — backend already supports this flow.
- No changes to message sending inside an already-open conversation (`useSendMessage` + `useRealtimeChat` already work).
- No edge function changes.

## Verification checklist after build

1. Swipe deck card → message icon → dialog → send → lands in `/messages` with the new thread, message visible.
2. Roommate matching message button → dialog renders → send → thread opens.
3. "Who liked you", "Interested clients", "Liked properties", "Worker discovery" → each "Message" button opens a thread.
4. Notification "Reply" actions → open the correct thread.
5. Sending a message in thread A on device 1 appears in real time on device 2 (already works via `useRealtimeChat`; just confirm).
6. Unread badge in `BottomNavigation` increments and clears (already wired in `useUnreadMessageCount`).

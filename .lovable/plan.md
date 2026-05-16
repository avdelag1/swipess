## Plan: Make messaging work from every chat button

### 1. Lock all chat entry points to real backend users
- Audit and update every `useStartConversation` caller:
  - swipe card message button
  - roommate matching
  - liked clients/properties
  - client profile views
  - public listing preview
  - worker/service discovery
  - direct `/messages?startConversation=` deep links
- Ensure every chat button passes a real backend `user_id` UUID, not demo/mock IDs or card/listing IDs.
- Remove client-side quota gating from conversation starts so messaging is always allowed for authenticated users.

### 2. Replace fragile conversation creation with a reliable backend path
- Add a backend RPC/function for starting or finding a conversation that:
  - validates the signed-in sender
  - resolves client/owner roles from `user_roles`
  - creates exactly one conversation between the two users
  - attaches `listing_id` when present
  - inserts the first real message into `conversation_messages`
  - returns the canonical `conversationId`
- Add a uniqueness guard so repeated buttons from different app sections open the same conversation instead of creating duplicates.
- Update `useStartConversation` to call this backend function instead of guessing roles on the frontend.

### 3. Guarantee delivery, realtime sync, and notifications
- Consolidate duplicate conversation-message triggers so one clean trigger updates `last_message_at` and creates the recipient notification.
- Verify realtime is enabled for:
  - `conversations`
  - `conversation_messages`
  - `notifications`
- Make inbox subscriptions refresh only conversations involving the current user.
- Ensure the recipient sees:
  - the conversation in `/messages`
  - the real message in the chat thread
  - unread count updates
  - an in-app notification record

### 4. Remove mock/demo chat conflicts
- Remove demo client profiles from smart client/roommate decks because those IDs cannot exist in the backend and cannot receive messages.
- Keep listing/client decks ordered from backend data only.
- Fix the frontend sorting override that currently reorders backend listing results after the RPC returns them.

### 5. Clear the chat window UI
- Remove premium/token/activation overlays from the active chat interface.
- Remove or disable the auto-opening welcome bonus modal so it cannot block messages.
- Keep the chat screen focused on:
  - conversation header
  - message list
  - typing area
  - send button
- Keep premium/token links only in settings/package pages, not blocking active chats.

### 6. Validate with real backend data
- Check current backend schema, RLS policies, triggers, and recent messaging rows.
- Verify conversation creation works through the backend function.
- Verify message insert creates the recipient notification.
- Verify existing chat routes open a real conversation by ID.
- Run targeted frontend tests/build verification after code changes.

### Technical details
- Main frontend files likely affected:
  - `src/hooks/useConversations.tsx`
  - `src/pages/MessagingDashboard.tsx`
  - `src/components/MessagingInterface.tsx`
  - `src/components/WelcomeBonusModal.tsx`
  - `src/hooks/smartMatching/useSmartClientMatching.tsx`
  - `src/hooks/smartMatching/useSmartListingMatching.tsx`
  - chat-entry components/pages found in the audit
- Backend migration likely affected:
  - create `public.start_conversation_with_message(...)`
  - add/repair conversation uniqueness and notification trigger behavior
  - clean duplicate triggers on `conversation_messages`

### Note
I won’t run manual git push commands from the sandbox; Lovable’s normal sync will carry approved changes to the connected main branch.
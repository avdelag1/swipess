# Profile polish + Core engagement systems audit

## 1. Profile page — theme-aware photo background + visible initial

**Files:** `src/pages/ClientProfileNew.tsx`, `src/pages/OwnerProfile.tsx`

- Wrap the profile photo / initial-letter container with a background that follows the active theme:
  - Light theme → `bg-white` with dark initial letter (`text-zinc-900`)
  - Dark theme → `bg-black` with white initial letter (`text-white`)
- Use the existing `useAppTheme()` `isLight` flag (already used in `TopBar`) for switching.
- Ensure the first letter of the user's name (`full_name?.[0]?.toUpperCase()`) renders centered when no photo is set, and remains readable over the matching background.
- Keep dimensions, ring, and shadow tokens unchanged (Structural Protection rule).

## 2. Tokens icon → Mexican Pink

**File:** `src/components/TopBar.tsx` (line ~210, the `Crown` icon for Tokens)

- Replace the current purple `#8b5cf6` with **Mexican Pink `#E4007C`**.
- Update the dark-theme drop-shadow glow to match: `drop-shadow(0 0 8px rgba(228,0,124,0.6))`.
- Add a semantic token `--mexican-pink: 328 100% 45%` in `src/styles/tokens.css` and a Tailwind alias `mexican-pink` so the color is reusable (per design system rule: no hardcoded hex outside tokens).

## 3. Verify Find / Search listings flow

**Files to inspect & repair if broken:** `src/components/filters/DiscoveryFilters.tsx`, `src/state/filterStore.ts`, `src/hooks/useDiscoveryListings*` (or equivalent), `src/lib/swipe/SwipeQueue.ts`.

- Confirm filter changes persist to `client_filter_preferences` and immediately re-query the discovery deck.
- Confirm category / price / location filters narrow results (not silently bypassed).
- Add an empty-state radar message when nothing matches.

## 4. Notifications — in-app + push

- **In-app:** verify `useNotificationSystem` + `NotificationBar` fire on new `likes`, `matches`, `conversation_messages` (real-time channels). Ensure RLS allows the recipient to `SELECT` the row that triggered the notification.
- **Outside the app (push):**
  - Confirm `usePushNotifications.subscribe()` is invoked from a user-action (Settings) — required by Apple/PWA.
  - Verify `send-push-notification` edge function is invoked from triggers in: new like, new match, new message.
  - Check `VAPID_PUBLIC_KEY` is wired in client and server. Inspect recent edge logs for failures and patch.

## 5. Likes / Matches / Messages

- **Likes:** confirm `useSwipeWithMatch` writes `{ user_id, target_id, target_type, direction }` and that an opposite right-swipe creates a `matches` row.
- **Matches:** confirm `matches` insert triggers (a) notification to both users, (b) creation of a `conversations` row (client_id/owner_id/listing_id).
- **Messages:** confirm `conversation_messages` insert updates `conversations.last_message_at`, marks unread for the recipient, and pushes a notification.
- Patch any missing pieces (likely: missing notification insert on match, missing push trigger on message).

## 6. Share + Report

- **Share:** verify `content_shares` insert succeeds (RLS already allows). Make sure share buttons on swipe card + profile call the same util and copy a working `share_url` (deep link to `/listing/:id` or `/profile/:id`).
- **Report:** verify the report modal writes to `user_reports` with `reporter_id = auth.uid()`. Ensure admins can `SELECT` reports — add an RLS policy `has_role(auth.uid(), 'admin')` for SELECT/UPDATE if missing. Add admin notification (insert into `notifications` for each admin) so reports surface in the admin dashboard.

## 7. QA pass

- Smoke test: swipe right on a listing as Client A logged in as Owner B simultaneously → expect like, match, conversation, in-app banner, push notification.
- Smoke test: send a message → recipient receives in-app + push.
- Smoke test: report a listing → admin sees it in admin queue.
- Visual: verify Mexican-Pink Tokens icon contrast in both themes and profile photo background swaps cleanly with theme toggle.

## Technical notes

- Use existing `has_role()` helper for any admin RLS additions; never store roles on profile.
- All new colors via semantic tokens (`hsl(var(--mexican-pink))`).
- No structural rewrites; enhancements only, per Structural Protection Rule.
- Push subscribe must remain user-initiated (no auto-prompt on load) to satisfy Apple/PWA policy.

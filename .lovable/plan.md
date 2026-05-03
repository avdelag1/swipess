
# End-to-End App Stabilization Plan

Goal: take Swipess from "almost-there" to shippable. Fix every TypeScript error, simplify the theme system to the two-color rule you defined (white bg → dark text, black bg → light text), wire up missing UI bits (tokens chip in TopBar, notifications), confirm admin exclusion is global, harden Supabase wiring (notifications, likes, matches, conversations, geolocation), and clean repo debt — without breaking swipe physics, routing, or brand.

## 1. TypeScript & Build Health (zero `tsc` errors)

Fix each error from `tsc-errors-utf8.txt` at the source (state slice / interface), not by patching consumers:

- **filterStore**: add back `filters` getter + `setServiceTypes` / `setPropertyTypes` actions (or remove their callers in `DiscoveryFilters.tsx` / `AppLayout.tsx`).
- **modalStore**: add `showMapFullscreen` to `ModalState` (used by `DashboardLayout`).
- **SoundEngine**: add `playMessageSent`; fix `useVoiceVisualizer` return type so `pulse` exists and `analyser` arg type matches.
- **SwipeExhaustedStateProps**: extend to accept `radiusKm`, `onRadiusChange`, `onDetectLocation`, `detecting`, `detected`, `error`, `role`, `lat`, `lng`. Fix `setIndex` callback signature in `SwipessSwipeContainer.tsx:1189`.
- **Filter sub-components** (`PropertyClientFilters`, `MotoClientFilters`, `BicycleClientFilters`, `WorkerClientFilters`): make `activeCount` optional or pass it from `ClientFilters.tsx`.
- **OwnerFilters.tsx**: import `useRef`; align `CategoryType` union with `'leads' | 'motos' | 'bikes' | 'jobs'` literals.
- **Null safety**: `ClientProfileNew` (`profile?.interests?.length ?? 0`), `Index.tsx` (`user!` guard), `WorldRadioDirectory` (`s.genre ?? ''`).
- **Misc**: import `EmptyState` in `LikedClients.tsx`; restore or remove `EnhancedOwnerDashboard` lazy import; type the `notif`/`i` params in `NotificationsPage`; align `useNotifications` hook to actually return `notifications`, `isLoading`, `markAsRead`, `deleteNotification`, `markAllAsRead`.
- **VirtualizedMessageList**: drop the dead `'ivanna-style'` comparison.
- **RootProviders.tsx:79**: fix theme comparison against the current `Theme` union.
- **lazyComponentLoader**: remove or fix the `EnhancedOwnerDashboard` import.

Result: `tsc --noEmit` passes; build is green.

## 2. Theme Simplification (the "two-color rule")

Centralize so every component reads ONE boolean and never branches on theme strings:

- In `ThemeContext`, expose `isLight: boolean` derived from the active theme (light/Swipess-style daylight = true; dark/cheers/Swipess-style dark = false).
- Codemod across the ~30 files in `remaining_islight.txt`:
  - Remove every local `const isLight = theme === 'light' || theme === 'ivanna-style'`.
  - Replace with `const { isLight } = useAppTheme()`.
  - Collapse multi-theme ternaries into the two-state rule:
    - Surfaces: `isLight ? 'bg-white' : 'bg-black'` (or the existing `bg-background` token, which already does this).
    - Text: `isLight ? 'text-black' : 'text-white'` (prefer `text-foreground`).
- Remove dead theme strings (`ivanna-style`, `red-matte`, `amber-matte`, `pure-black`) from the `Theme` union, `GlobalThemeSettings`, and any switch/compare site. Keep the four sanctioned themes: `light`, `dark`, `cheers`, `Swipess-style`.
- Result: filters and chrome become unambiguous — white bg = black text, black bg = white text — across the whole app.

## 3. TopBar: Tokens chip + correct buttons

- Add a **Tokens chip** to `TopBar` (right cluster, just before the Filters button) showing the user's remaining message activations / tokens, tapping → `/subscription/packages`. Source: `message_activations` table (already exists) plus any token wallet field.
- Verify owner vs client TopBar slots: owner does NOT need Perks; client keeps Perks via BottomNavigation.
- Make sure the header is truly frameless on dashboard routes (transparent prop already in place — confirm no residual `border-b` or `bg-card` leaks).

## 4. BottomNavigation audit (per role)

- Client: Dashboard, Liked, Messages, Perks, Profile.
- Owner: Dashboard, Properties (Listings), Insights (Liked Clients), Messages, Profile.
- Confirm icons render and tap targets are 44px+. No Perks on owner side (per your call).

## 5. Admin exclusion (global)

- `useAdminUserIds` now reads `user_roles` (good). Wire it into:
  - `useDiscoveryListings` / client deck builder (filter out listings whose `user_id`/`owner_id` is admin).
  - Owner client deck (`useClientProfiles`) — exclude admin `user_id`s.
  - `LikedClients` / `OwnerInterestedClients` lists.
  - Conversation list (hide threads with admin counterpart unless the admin is the support channel — TBD).
- Add a unit-style guard so admin profiles never appear even if cache is stale (filter at render too).

## 6. Owner-side Insights/Message/Share parity

Mirror the client-side flows in `ClientSwipeContainer` action handlers:

- **Insights**: `LikedClientInsightsModal` — show full client profile (photos carousel, age, intents, languages, location, verified badge, interests). Same layout grammar as `LikedListingInsightsModal`.
- **Message**: open the unified message composer using `conversations` (create if missing with `client_id` = liked user, `owner_id` = current owner). Respect `message_activations` quota.
- **Share**: same share sheet used on client side, writing to `content_shares` with `shared_profile_id`.

## 7. Geolocation (real, precise, opt-in)

- One-tap "Detect my location" in the exhausted state and in filters → `navigator.geolocation.getCurrentPosition` with permission UX.
- Persist `latitude`/`longitude` on `client_profiles` and `listings` (already columns) and on `owner_profiles` if applicable.
- Distance queries: add a Postgres RPC `nearby_listings(lat, lng, radius_km, category)` using the haversine formula (no PostGIS extension needed; if PostGIS is enabled, prefer `ST_DWithin`). Same for `nearby_clients` for owner discovery.
- Show "X.X km away" chip on every card (properties, motos, bikes, workers, clients).
- Fallback: manual city/neighborhood input writes coords via geocoding (or skips distance).

## 8. Notifications end-to-end

- Fix `useNotifications` to actually subscribe to `notifications` table changes (already realtime-capable), expose: `notifications`, `isLoading`, `markAsRead`, `markAllAsRead`, `deleteNotification`.
- `NotificationsPage` renders the list; tap → deep-link via `link_url`/`metadata`.
- Triggers we need (DB side) — confirm or add via migration:
  - On new `likes` row where target is a user/listing → notify target's owner.
  - On new `matches` → notify both parties (flame alert).
  - On new `conversation_messages` → notify recipient.
- Web Push: VAPID keys already set. Verify `send-push-notification` edge function fires on the events above.

## 9. Supabase wiring sanity pass

- Confirm RLS for: `likes` (insert with own user_id), `matches` (read by both parties), `conversations`/`messages` (participant-only via `is_conversation_participant`), `notifications` (own only).
- Confirm `handle_new_user` trigger creates `profiles` + default `client` role (it does).
- Add an idempotent migration to ensure realtime publication includes `messages`, `conversations`, `notifications`, `likes`, `matches`.
- No changes to admin-app-managed tables (business_partners, concierge_knowledge, events, discount_offers) — read-only from this app.

## 10. Repo housekeeping

- Delete committed debug artifacts: `tsc-errors-utf8.txt`, `isLight_*.txt`, `remaining_islight.txt`, `find_undeclared_islight.cjs`, `check_islight.cjs`.
- Keep a single lockfile: **`bun.lock`** (project uses bun). Delete `package-lock.json` and `pnpm-lock.yaml` if present.
- No git operations from sandbox — Lovable's GitHub Actions handle the mirror to your original repo and Vercel.

## Out of scope (intentionally untouched)

- Swipe physics, card stack recycling, parallax — preserved as-is.
- Admin App (separate codebase) — we only consume its data.
- Theme aesthetic — we simplify the matrix, we do not redesign.

## Technical notes

- Files most-touched: `src/state/filterStore.ts`, `src/state/modalStore.ts`, `src/contexts/ThemeContext.ts`, `src/components/TopBar.tsx`, `src/components/BottomNavigation.tsx`, `src/components/SwipessSwipeContainer.tsx`, `src/components/SwipeExhaustedState.tsx`, `src/components/ClientSwipeContainer.tsx`, `src/components/LikedClientInsightsModal.tsx`, `src/hooks/useNotifications.ts`, `src/hooks/useAdminUserIds.ts`, `src/pages/ClientFilters.tsx`, `src/pages/OwnerFilters.tsx`, `src/pages/NotificationsPage.tsx`, plus the ~30 files in the isLight codemod.
- One Supabase migration: distance RPC + (if missing) realtime publication adds + notification triggers.
- One edge-function check: `send-push-notification` invoked by triggers.

## Acceptance checks

1. `tsc --noEmit` clean.
2. App builds, dashboard renders frameless on both roles.
3. Tokens chip visible in TopBar; tap routes to packages.
4. Switching theme between Daylight ↔ Midnight flips every surface to the two-color rule with no broken contrast.
5. Admin accounts never appear in any deck, list, or insights view.
6. Owner can tap a liked client → full Insights modal, message, share — parity with client side.
7. "Detect my location" populates lat/lng; cards show distance; radius slider returns nearby results.
8. Likes/matches/messages each fire a `notifications` row + push; bell page lists, marks read, deletes.
9. Repo has one lockfile and zero debug `.txt` files.

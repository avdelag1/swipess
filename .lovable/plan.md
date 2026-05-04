## Goal

Bring the top header to Apple-review quality (profile chip, mode switcher, tokens, theme, notifications) and audit the live wiring between Filters → Discovery, Likes → Chat, and Roommate Match.

## Part 1 — TopBar visual polish (`src/components/TopBar.tsx`, `src/components/ModeSwitcher.tsx`)

Current issues spotted in code:
- Pills are only 30px tall — too small, fails Apple's 44pt touch target guideline.
- Profile chip uses `UserCircle` lucide icon as fallback inside a 24px circle — looks weak, low fidelity.
- Tokens / Theme / Notification pills are squares with inconsistent widths (`w-7.5` is invalid Tailwind, silently does nothing).
- ModeSwitcher uses bespoke 30px height that doesn't align vertically with the other pills.
- No real elevation hierarchy — all pills share the same flat shadow.

Changes:
1. **Unified pill system**: introduce one `glassPillStyle` with `height: 36px`, min-width 36px, radius `1rem`, shared elevation tokens. Apply to profile chip, tokens, theme, notifications, back button, mode switcher container — so they line up perfectly on a single baseline.
2. **Profile chip upgrade**:
   - 28px avatar inside the pill (was 24).
   - Real `Avatar`/`AvatarImage`/`AvatarFallback` (already imported but unused) — fallback shows user initials on a rose→violet gradient instead of generic `UserCircle`.
   - Subtle 1px inner ring + 2px outer rose glow when on client mode, violet glow on owner mode (ties to Nexus palette).
   - First-name label uses tabular-nums and slightly tighter tracking.
3. **Action pills (Tokens / Theme / Notifications)**:
   - Replace `w-7.5` (invalid) with proper `w-9` (36px) square pills.
   - Icon size 16px, stroke 2.2.
   - Tokens pill keeps the orange→rose gradient but with a softer inner highlight (top 1px white@8%) for depth.
   - Add `whileTap={{ scale: 0.92 }}` consistently and a 120ms spring.
4. **ModeSwitcher**:
   - Match 36px height of siblings.
   - Sliding indicator becomes a proper rounded-rectangle pill (not a square), 28×28, with the rose→violet client gradient and violet→indigo owner gradient (Nexus palette per directive).
   - Disabled state: 50% opacity instead of nothing.
5. **Back button**: same 36px pill, ChevronLeft 16px, identical glass treatment so the left cluster reads as one unit.
6. **Light/dark parity**: tighten light-mode borders to `rgba(0,0,0,0.06)` and shadow to `0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)` for the layered depth required by the design memory.

No structural changes — same components, same props, same layout slots. Visual + proportion refinement only (per the Structural Protection Rule in project knowledge).

## Part 2 — Connection audit (read-only verification + targeted fixes)

For each flow I'll open the relevant files, confirm the wiring is intact post-sync, and patch only what's broken:

1. **Filters ↔ Discovery**
   - `src/state/filterStore.ts` → `getListingFilters()` / `getClientFilters()`.
   - `src/hooks/smartMatching/useSmartListingMatching.tsx` and `useSmartClientMatching.tsx` consume `filterVersion` from the store.
   - Verify `ClientDashboard` and the owner equivalent re-memoize on `filterVersion` (already does for client — confirm owner mirror).
   - Verify `OwnerClientFilterDialog` and `AdvancedFiltersDialog` write back through the same store actions.

2. **Likes / Matches → Messaging**
   - `useSwipeWithMatch` → `likes` table → match detection → `conversations` row creation.
   - `MessagingInterface.tsx` was just refactored for `TokensModal` — confirm the conversation list still subscribes to the right realtime channel and that `is_conversation_participant` RPC is used in RLS.
   - `useUnreadMessageCount` badge feeds BottomNavigation — confirm query key matches.

3. **Roommate Matching**
   - `src/pages/RoommateMatching.tsx` was just patched with a category cast.
   - Confirm it uses the same `SwipessSwipeContainer` deck and that `roommate_available` toggle on `client_profiles` is what filters the pool (per the Roommate Matching memory).
   - Confirm the swipe writes to `likes` with `target_type` and triggers the same match flow as Discovery.

4. **AI Concierge sanity** (light pass): just confirm the edge function still receives auth and that `ai-concierge` is still wired in `ConciergeChat.tsx` after the sync.

Any wiring break found will be fixed in the same pass with minimal diff.

## Out of scope

- No layout/architecture changes.
- No new components or features.
- No swipe physics changes.
- No backend/migration changes unless an audit finding requires one (will surface as a question first).

## Files expected to change

- `src/components/TopBar.tsx`
- `src/components/ModeSwitcher.tsx`
- `src/components/NotificationPopover.tsx` (only the trigger pill class — to match)
- `src/components/ThemeToggle.tsx` (only the trigger pill class — to match)
- Plus targeted patches in any audit finding (likely 0–2 files in `useSmartClientMatching.tsx`, `MessagingInterface.tsx`, or `RoommateMatching.tsx`).

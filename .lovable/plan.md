

## Plan: Redesign Roommate Matching — Full Swipe Card System + Roommate Toggle

### Summary

Rebuild the Roommate Matching page to use the same full-screen swipe card UX as the main dashboard, with the same `SwipeActionButtonBar` buttons. Add a `roommate_available` toggle to `client_profiles` so users can opt in/out of being discoverable as roommates.

### Changes

#### 1. Database Migration — Add `roommate_available` column

Add a boolean column `roommate_available` (default `false`) to `client_profiles`. This lets users toggle whether they appear in the roommate discovery deck.

```sql
ALTER TABLE public.client_profiles 
ADD COLUMN IF NOT EXISTS roommate_available boolean DEFAULT false;
```

#### 2. Redesign `src/pages/RoommateMatching.tsx` — Full swipe card experience

Replace the current basic card layout with the same architecture used in `ClientSwipeContainer`:
- Use `SimpleOwnerSwipeCard` (since we're swiping through user profiles, same as owner side)
- Use `SwipeActionButtonBar` for like/dislike buttons (same Flame + ThumbsDown style)
- Full-screen card stack with next card visible behind at `scale(0.95), opacity(0.7)`
- Cards have the same drag physics, rotation, YES!/NOPE overlays
- Filter candidates to only those with `roommate_available = true`
- Keep the compatibility badge overlay (Sparkles icon with percentage)
- Add a toggle at the top: "Show me as roommate" switch that updates `client_profiles.roommate_available`

Key structural changes:
- Remove the custom `motion.div` card and `AnimatePresence` — use `SimpleOwnerSwipeCard` instead
- Remove the custom round buttons — use `SwipeActionButtonBar` instead
- Use `useRef<SimpleOwnerSwipeCardRef>` for button-triggered swipes
- Map `RoommateCandidate` data to the `ClientProfile` interface expected by `SimpleOwnerSwipeCard`
- Position action buttons at `bottom: clamp(88px, 14vh, 128px)` matching main dashboard

#### 3. Add roommate toggle to profile page

Add a simple toggle switch in the client profile settings (or directly on the roommate page header) that sets `roommate_available` on/off. When toggled, upsert to `client_profiles`.

### Files to Edit

| File | Change |
|------|--------|
| Database migration | Add `roommate_available` boolean column to `client_profiles` |
| `src/pages/RoommateMatching.tsx` | Full rewrite: use `SimpleOwnerSwipeCard` + `SwipeActionButtonBar`, add roommate toggle, filter by `roommate_available` |


## Why nothing is rendering

The preview is currently blank for header buttons / nav buttons because the project has **8 TypeScript build errors** (reported by the build system). When the build fails, the dashboard chunks don't mount and the `TopBar` / `BottomNavigation` controls disappear with them. Both bars are mounted unconditionally in `AppLayout.tsx`, so the only reason they aren't visible is the broken build.

Once the build is green, the bars come back. Then the only remaining visual ask is: **no frame/background on the header itself** — just the round pill buttons floating over the swipe deck.

---

## Plan

### 1. Fix the 8 build errors (unblocks the preview)

| # | File | Fix |
|---|------|-----|
| 1 | `src/components/DigitalSignaturePad.tsx:108` | `uiSounds.playSwoosh()` doesn't exist. Replace with `uiSounds.playTap()` (which does exist in `src/utils/uiSounds.ts`). |
| 2 | `src/components/LikedClientInsightsModal.tsx:507, 517` | Missing `cn` import. Add `import { cn } from '@/lib/utils';`. |
| 3 | `src/components/LikedClientInsightsModal.tsx:656` | `ReportDialog` has no `targetId` / `targetType` / `targetName` props. Real props are `reportedUserId`, `reportedListingId`, `reportedUserName`, `category`. Replace usage with the correct props (`reportedUserId={client.user_id}`, `reportedUserName={client.name}`, `category="user_profile"`). |
| 4 | `src/components/LikedListingInsightsModal.tsx:679` | Same `ReportDialog` prop mismatch. Replace with `reportedListingId={listing.id}`, `reportedUserId={listing.owner_id}`, `reportedListingTitle={listing.title}`, `category="listing"`. |
| 5 | `src/components/GlobalDialogs.tsx:218` | `LikedClientInsightsModal` expects a `LikedClient` (full_name, bio, images, liked_at) but receives a `ClientProfile`. Map the profile to the `LikedClient` shape inline (fill `full_name`, `bio`, `images`, `liked_at` from the profile, defaulting empty strings/arrays/`new Date().toISOString()` when missing). |
| 6 | `src/components/OwnerClientSwipeDialog.tsx:60` | Same mapping problem. Apply the same `ClientProfile → LikedClient` adapter before passing to the modal. |
| 7 | `src/components/PropertyManagement.tsx:439` | `ChevronRight` used but not imported. Add `ChevronRight` to the existing `lucide-react` import on line 14. |

### 2. Remove the header frame (visual fix the user asked for)

In `src/components/TopBar.tsx`:

- The `<header>` already has `background: 'transparent'` and `border: 'none'` — that's correct. Confirm and keep.
- Audit `AppLayout.tsx` and `SentientHud.tsx` wrappers around `<TopBar>` — neither should add a background or border. Both currently look clean (`pointer-events-none` only). No changes expected here, but verify in pass.
- The user complained about a frame appearing on the header. Likely culprit: a stray container/outline inherited from the surrounding HUD or a leftover background on the `<header>` element from a previous edit. The current code in `TopBar.tsx` is clean, but we will explicitly **remove any backdrop / shadow / border on the `<header>` and its inner row**, leaving only the individual button pills (`glassPillStyle`) and the `ModeSwitcher` pill — those are the "buttons with their own frames" the user said they want to keep.

### 3. Verification

- After the edits, the harness rebuilds; confirm 0 TypeScript errors.
- Reload `/owner/dashboard` and `/client/dashboard`:
  - Header pills (profile, mode switcher, tokens, radio, dashboard, filter, AI, theme, notifications) are visible and tappable.
  - Bottom navigation bar pill is visible and tappable.
  - No outer frame/background behind the header — only the individual round buttons float over the swipe deck.

### Files touched

- `src/components/DigitalSignaturePad.tsx`
- `src/components/LikedClientInsightsModal.tsx`
- `src/components/LikedListingInsightsModal.tsx`
- `src/components/GlobalDialogs.tsx`
- `src/components/OwnerClientSwipeDialog.tsx`
- `src/components/PropertyManagement.tsx`
- `src/components/TopBar.tsx` (only if any residual frame styling is found)

No database, no schema, no logic changes — purely build fixes + the header-frame cleanup you asked for.



## Plan: Fix Multiple UI Issues

### Issues Identified

1. **Dark floating pill between header and cards** — The invisible center-tap button in TopBar (`h-10 w-20 rounded-full bg-transparent`) may be rendering visibly in some contexts. Will remove it entirely since its function is redundant.

2. **Token icon (MessageCirclePlus) next to mode switcher** — Currently a plain `MessageCirclePlus` icon that looks generic. Will replace with a more premium, branded icon (e.g., a `Zap` or `Gem` icon with accent color glow).

3. **Likes pages scrolling broken** — The likes page containers use `min-h-full overflow-visible` which creates a conflict with the parent `<main>` `overflow-y-auto`. Will fix by ensuring proper scroll delegation — likes pages should use `min-h-[101dvh] pb-32` pattern (like `ClientWhoLikedYou` already does) and remove conflicting `overflow-visible` declarations.

4. **Back button missing on client listing insight / owner client profile pages** — The TopBar already renders a back arrow when `showBack` is true, and `showBack` is already set for non-dashboard routes. The issue is likely that these insight/review pages open as modals or dialogs (e.g., `LikedListingInsightsModal`, `LikedClientInsightsModal`) rather than navigable routes, so there's no route-level back button. Will ensure these modals have clear close/back buttons.

5. **Swipe category cards hanging/going down** — The poker card stack uses `justify-center` but may drift down due to parent flex layout. Will ensure the card deck container is properly centered vertically within the viewport space between header and bottom nav.

### Technical Changes

**File: `src/components/TopBar.tsx`**
- Remove the invisible center tap button (lines 100-108) that creates the dark floating pill artifact.
- Replace `MessageCirclePlus` token icon with `Sparkles` or `Zap` icon, add a subtle brand accent glow for a cooler look.

**File: `src/pages/ClientLikedProperties.tsx`**
- Change container from `min-h-full overflow-visible` to `min-h-[101dvh] pb-32` with no `overflow-visible`.
- Remove redundant inline `touchAction`/`WebkitOverflowScrolling` styles (parent handles scroll).

**File: `src/components/LikedClients.tsx`**
- Same scroll fix: change from `min-h-full overflow-visible` to `min-h-[101dvh] pb-32`.
- Remove redundant touch/overflow styles.

**File: `src/pages/ClientWhoLikedYou.tsx`**
- Already uses correct pattern (`min-h-[101dvh] pb-32`). Verify no issues.

**File: `src/components/LikedClientInsightsModal.tsx`**
- Ensure the modal has a prominent back/close button at the top.

**File: `src/components/LikedListingInsightsModal.tsx`**
- Same — ensure visible close/back button.

**File: `src/components/swipe/SwipeAllDashboard.tsx` and `OwnerAllDashboard.tsx`**
- Ensure the card deck wrapper fills available space and centers cards vertically using `flex-1 items-center justify-center` without allowing content to drift downward.

**File: `src/pages/ClientDashboard.tsx`**
- Ensure the fan view wrapper uses `h-full` and centers properly.


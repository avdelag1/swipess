
Goal: fix five concrete UX failures without changing the app’s architecture: outside-tap modal close, top-tap dashboard shortcut, likes-page scrolling, back buttons on preview modals, and a simpler one-page virtual ID.

What I found
- Outside-tap already works for some overlays:
  - `VapIdCardModal` and `TokensModal` use custom full-screen backdrops with `onClick={close}`.
  - Radix `Dialog`-based popups should also close on outside interaction by default.
- The top-tap dashboard shortcut is currently missing from `TopBar.tsx`.
- The likes pages still have touch interception problems:
  - `ClientLikedProperties.tsx` uses `PremiumLikedCard` cards inside a normal grid.
  - `LikedClients.tsx` also uses `PremiumLikedCard`.
  - `ClientWhoLikedYou.tsx` and similar pages use `PremiumSortableGrid`; although drag is disabled on touch, the wrapper still installs pointer handlers on every card shell.
  - `PremiumLikedCard.tsx` puts clickable image/action zones across the full card, so much of the visible card is optimized for taps, not drag-to-scroll feel.
- Preview modals do have close X buttons, but no obvious back-style control:
  - `LikedClientInsightsModal.tsx`
  - `LikedListingInsightsModal.tsx`
- `VapIdCardModal.tsx` is currently a multi-section premium/glass design; this does not match your request for a simpler, single-page scrollable ID.

Implementation plan

1. Restore the top-tap “go to dashboard” shortcut
- Update `src/components/TopBar.tsx`.
- Add a centered invisible/very-light hit target in the header that only handles a simple tap.
- Route to `/client/dashboard` or `/owner/dashboard` depending on role.
- Make sure it does not block scroll or other header controls:
  - keep the header wrapper `pointer-events-none`
  - keep only the center hit target `pointer-events-auto`
  - use `touch-manipulation`
  - keep the hit area narrow and shallow so it doesn’t recreate the old floating visual artifact.

2. Make outside-tap dismissal consistent across popups
- Audit shared popup primitives and key custom modals:
  - `src/components/ui/dialog.tsx`
  - `src/components/ui/popover.tsx`
  - `src/components/NotificationPopover.tsx`
  - `src/components/TokensModal.tsx`
  - `src/components/VapIdCardModal.tsx`
- Ensure every non-destructive popup closes when tapping outside unless it is a true confirmation dialog.
- Keep `AlertDialog` confirmations unchanged, since destructive confirmations should remain explicit.
- For Dialog-based popups that may currently resist outside close because of custom event handling, remove any unnecessary stop-propagation or add explicit outside handlers only where needed.

3. Fix likes-page scrolling at the touch-surface level
- Main fix: make the whole visible card behave like a vertical scroll surface first, and only trigger actions on deliberate taps.
- Update `src/components/PremiumLikedCard.tsx`:
  - remove any card-level gesture behavior that makes the surface feel “tap-first”
  - ensure root/image/content wrappers all consistently use `touch-action: pan-y`
  - limit action taps to the actual buttons and explicit image tap target
  - avoid any hidden pointer blockers on decorative layers.
- Update likes page wrappers:
  - `src/pages/ClientLikedProperties.tsx`
  - `src/components/LikedClients.tsx`
  - `src/pages/ClientWhoLikedYou.tsx`
- For pages using reorderable grids (`ClientWhoLikedYou` and related pages), either:
  - disable reorder mode entirely on touch-heavy likes screens, or
  - remove the sortable wrapper from these pages and render a plain grid/list instead.
- I recommend the second option for these pages: plain grid/list on likes screens, because vertical scrolling is more important than reordering.
- Also verify `DashboardLayout.tsx` keeps scroll ownership on `#dashboard-scroll-container` and that these pages do not introduce nested scroll traps.

4. Add proper back buttons to the preview/detail modals
- Update:
  - `src/components/LikedClientInsightsModal.tsx`
  - `src/components/LikedListingInsightsModal.tsx`
- Add a left-aligned back button in the top overlay/header area, not just a close X on the right.
- Back button behavior:
  - closes the modal and returns the user to the likes page beneath it
  - uses the existing route context, not full navigation away.
- Keep the X if desired, but make the back button the primary visible control.

5. Rebuild the virtual ID as a simple, single-page scrollable layout
- Redesign `src/components/VapIdCardModal.tsx` to be much simpler:
  - one modal
  - one scrollable page
  - no heavy glassmorphism
  - no oversized decorative framing
- New structure:
  - clean header with title + back/close
  - primary ID block:
    - square photo on the left with rounded corners
    - identity text on the right
    - simple ID number / status row
  - below that:
    - basic personal info rows
    - short bio/about
    - documents section
- Keep it vertically scrollable inside the modal instead of visually splitting into multiple dramatic surfaces.
- Keep document upload/status functionality, but present it plainly.

Files to change
- `src/components/TopBar.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/popover.tsx` if needed
- `src/components/NotificationPopover.tsx`
- `src/components/TokensModal.tsx`
- `src/components/PremiumLikedCard.tsx`
- `src/pages/ClientLikedProperties.tsx`
- `src/components/LikedClients.tsx`
- `src/pages/ClientWhoLikedYou.tsx`
- potentially `src/pages/OwnerInterestedClients.tsx` too, for the same scroll pattern
- `src/components/LikedClientInsightsModal.tsx`
- `src/components/LikedListingInsightsModal.tsx`
- `src/components/VapIdCardModal.tsx`

Expected outcome
- Tapping outside closes normal popups consistently.
- Tapping the top-center header area returns to the dashboard.
- Likes pages scroll naturally from anywhere your finger starts, including over cards and action areas.
- Preview/detail modals have a clear back button.
- The virtual ID becomes a simple, cleaner, one-page scrollable ID layout instead of the current oversized glass card.

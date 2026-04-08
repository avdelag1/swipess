

## Plan: Fix Likes Page Scrolling (Client + Owner)

### Root Cause

The `#dashboard-scroll-container` in `DashboardLayout.tsx` applies `contentVisibility: 'auto'` with `containIntrinsicSize: '100dvh'` (line 506). This CSS containment property tells the browser it can skip rendering off-screen content, which can collapse the scrollable height and prevent or break scrolling — especially on pages like the Likes pages where content is dynamically loaded.

Additionally, `LikedClients.tsx` (owner side) lacks `min-h-[101dvh]` that `ClientLikedProperties.tsx` has, which can cause the content to not be tall enough to scroll in some states.

### Changes

**File: `src/components/DashboardLayout.tsx`**
- Remove `contentVisibility: 'auto'` and `containIntrinsicSize: '100dvh'` from the scroll container's inline style (line 506). These properties are meant for children inside a scroll container, not the scroll container itself. Removing them restores normal scroll behavior without any visual impact.

**File: `src/components/LikedClients.tsx`**
- Change outer div from `overflow-visible` to match the client pattern: add `min-h-[101dvh]` and `overflow-x-hidden` so content always exceeds the scroll container height and scrolls naturally.

**File: `src/pages/ClientLikedProperties.tsx`**
- No structural change needed — already has `min-h-[101dvh]`. Just verify it stays consistent.

### Safety
- Zero logic changes
- Zero layout architecture changes
- Only removes a CSS containment property that was preventing scroll, and adds min-height to the owner likes page


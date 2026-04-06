

# Fix Scroll Isolation, Likes Filter Layout, Radio Visibility, Owner Nav Restructure

## Problems Identified

1. **Shared scroll state between pages** — `DashboardLayout` uses `overflow-visible` on the `<main>` container. Since all pages share the same scrolling context (the browser viewport), scrolling on Profile bleeds into Likes when navigating. Each page needs its own scroll container.

2. **Likes page filter button overlaps search bar** — The `SlidersHorizontal` filter toggle is positioned inside the search input (`absolute right-3`), overlapping with text. Move the filter button next to the Sync button, and remove the "Sync" text label — keep only the refresh icon to save space.

3. **Radio page invisible** — The radio component uses `fixed inset-0 z-[9999]` which should overlay everything. However, `AppLayout.tsx` marks radio as `isFullScreen` (line 70: `isRadioRoute`), which hides TopBar/BottomNav — good. But the issue is likely that the `<main>` in `AppLayout` has `overflow-y-auto` creating a containing block that traps the `fixed` positioning. Also, `DashboardLayout`'s `contentVisibility: 'auto'` may cause the radio's fixed container to be invisible. The fix: when on radio route, the main content wrapper must not clip or create a containing block.

4. **Owner nav: Merge Radar + Filters, add Promote & Events** — The Radar page (`/owner/clients/property`) already has inline `PropertyClientFilters`. The separate OwnerFilters page (`/owner/filters`) has gender, age, budget, nationality filters. Merge the OwnerFilters content into the Radar page, rename "Radar" to "Filters" in the nav, remove the separate Filters nav item and route. Add "Promote" and "Events" buttons to owner bottom nav.

---

## Plan

### 1. Fix Scroll Isolation Per Page

**File**: `src/components/DashboardLayout.tsx`

- Change `<main>` from `overflow-visible` to `overflow-y-auto` so it becomes the scroll container
- Add a `useEffect` that resets `scrollTop = 0` on `location.pathname` change — this ensures each page starts at the top when navigated to
- This isolates scroll position per navigation event

### 2. Restructure Likes Page Filter/Sync Bar

**File**: `src/pages/ClientLikedProperties.tsx`

- Move the filter `SlidersHorizontal` button OUT of the search input overlay
- Place it inline next to the Sync button (which becomes icon-only: remove "Sync" text, keep `RefreshCw` icon)
- Both buttons sit side-by-side after the category tabs, same row
- Search bar becomes clean with no overlapping button

**File**: `src/components/LikedClients.tsx`

- Apply the same pattern: filter button next to refresh button, not overlapping search

### 3. Fix Radio Page Visibility

**Files**: `src/components/AppLayout.tsx`, `src/components/DashboardLayout.tsx`

The radio uses `fixed inset-0 z-[9999]` which should work, but two things block it:

- In `AppLayout.tsx`: the outer `<div>` has `overflow-hidden` (line 93). A parent with `overflow-hidden` can clip fixed children in some mobile browser contexts. For radio routes, remove this restriction.
- In `DashboardLayout.tsx`: the `<main>` has `contentVisibility: 'auto'` and `containIntrinsicSize` (lines 506-507). CSS `content-visibility: auto` applies `contain: layout style paint` which creates a containing block that breaks `position: fixed` inside it. For radio routes, skip `contentVisibility`.
- Ensure `PersistentDashboardLayout.tsx` already skips `contentVisibility` for radio (it does — line 75-77). Confirm `DashboardLayout` does the same.

### 4. Merge Owner Filters Into Radar + Update Nav

**File**: `src/pages/OwnerPropertyClientDiscovery.tsx`

- Import the filter controls from OwnerFilters (gender, age range, budget range, nationality) directly into this page's mobile Sheet and desktop sidebar
- Use the same `useFilterStore` actions and `useOwnerClientPreferences` hook
- Rename page title from "Live Radar / Top Prospects" to "Client Filters"
- This becomes the single owner filter + discovery page

**File**: `src/components/BottomNavigation.tsx`

- Change `ownerNavItems` "Radar" entry to label "Filters" pointing to `/owner/clients/property`
- Remove the "Filters" (`SlidersHorizontal`) entry that calls `onFilterClick`
- Add "Promote" entry with `Megaphone` icon pointing to `/client/advertise` (shared page)
- Add "Events" entry with `PartyPopper` icon pointing to `/explore/eventos`

**File**: `src/App.tsx`

- Keep the `/owner/filters` route for backward compat but it can redirect to `/owner/clients/property`
- Or simply remove it

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/DashboardLayout.tsx` | Scroll isolation: `overflow-y-auto` + scroll reset on nav, skip `contentVisibility` for radio |
| `src/components/AppLayout.tsx` | Remove `overflow-hidden` clipping for radio route |
| `src/pages/ClientLikedProperties.tsx` | Move filter button next to icon-only refresh button |
| `src/components/LikedClients.tsx` | Same filter button restructure |
| `src/pages/OwnerPropertyClientDiscovery.tsx` | Merge OwnerFilters content (gender/age/budget/nationality) into Radar page |
| `src/components/BottomNavigation.tsx` | Owner nav: rename Radar→Filters, remove separate Filters, add Promote + Events |
| `src/App.tsx` | Optional: redirect `/owner/filters` to `/owner/clients/property` |


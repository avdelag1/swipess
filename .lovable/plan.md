
# Layout & UI Overflow Fix Plan

## Issues Identified from Screenshots

### 1. TopBar Overcrowding (All Screenshots)
The header has too many elements competing for horizontal space on mobile:
- Avatar (40-48px)
- Theme Toggle
- Mode Switcher ("BUSINESS SIDE ⇄")
- Filter dropdown
- Tokens button
- Notification bell

**Result:** Elements are cramped, notification bell is cut off by phone edge, text like "TOKENS" is truncated.

### 2. Profile Page Content Overlap (Screenshot 2)
`OwnerProfileNew.tsx` has `class="p-4"` but no top padding to clear the fixed TopBar. The profile header ("Set up your business", email) renders behind the header elements.

**Root cause:** Profile routes are marked as "immersive" in DashboardLayout (line 539), which sets `paddingTop: 0`, but `OwnerProfileNew` doesn't compensate with its own top padding (unlike `ClientProfileNew` which has `pt-[calc(56px+var(--safe-top)+1rem)]`).

### 3. Duplicate Back Buttons (Screenshot 3 - Liked Clients)
- TopBar shows a back button (`showBack={!isOnDiscoveryPage}`)
- `PageHeader` component also renders its own "← Back" button (`showBack={true}`)
- Creates visual redundancy and wastes vertical space

### 4. Swipe Card Info Behind Buttons (Screenshot 1)
The card metadata (rating badge, "New User" name) at bottom-left appears to conflict with the floating action button bar positioning.

---

## Implementation Plan

### Step 1: Simplify TopBar for Mobile
**File:** `src/components/TopBar.tsx`

Changes:
- Remove "TOKENS" text label on mobile (keep icon only)
- Remove "ALERTS" text label on mobile (keep icon only)
- Reduce avatar size on mobile (h-8 w-8 instead of h-10 w-10)
- Add proper right padding to prevent notification bell cutoff
- Consider hiding QuickFilterDropdown on very small screens (<380px)

```text
Current layout:
[Avatar] [Theme] [MODE SWITCHER] [FILTER] [⚡ TOKENS] [🔔]

Proposed mobile layout:
[Avatar] [☀️] [MODE] [⚡] [🔔]
```

### Step 2: Fix OwnerProfileNew Top Padding
**File:** `src/pages/OwnerProfileNew.tsx`

Change line 60:
```tsx
// FROM:
className="w-full max-w-lg mx-auto p-4 pb-32 space-y-6"

// TO:
className="w-full max-w-lg mx-auto p-4 pt-[calc(56px+var(--safe-top)+1rem)] pb-32 space-y-6"
```

### Step 3: Remove Duplicate Back Buttons from PageHeader
**File:** `src/components/LikedClients.tsx` (and similar pages)

Since TopBar already provides a back button, set `showBack={false}` on PageHeader:
```tsx
<PageHeader
  title="Liked Clients"
  subtitle="Profiles you've matched with"
  showBack={false}  // TopBar handles navigation
  actions={...}
/>
```

Apply same fix to:
- `src/pages/OwnerInterestedClients.tsx`
- `src/pages/ClientWhoLikedYou.tsx`
- `src/pages/ClientLikedProperties.tsx`
- Any other page using PageHeader with showBack={true}

### Step 4: Ensure Safe Area Padding on Right Edge
**File:** `src/components/TopBar.tsx`

Add right padding to the header to prevent notification bell cutoff:
```tsx
<div className="max-w-[1400px] mx-auto w-full flex items-center justify-between relative z-10 pr-2">
```

### Step 5: Fix Card Content Z-Index/Positioning
**Files:** Review swipe card overlay components

Ensure the card metadata (rating, name) at bottom has proper spacing to not conflict with the action button bar which sits below the card.

---

## Files to Modify
1. `src/components/TopBar.tsx` - Simplify mobile layout, fix right padding
2. `src/pages/OwnerProfileNew.tsx` - Add top padding
3. `src/components/LikedClients.tsx` - Remove duplicate back button
4. `src/pages/OwnerInterestedClients.tsx` - Remove duplicate back button
5. `src/pages/ClientWhoLikedYou.tsx` - Remove duplicate back button
6. `src/pages/ClientLikedProperties.tsx` - Remove duplicate back button

---

## Technical Notes

```text
Safe area spacing formula:
pt-[calc(56px+var(--safe-top)+1rem)]
        │       │             │
        │       │             └─ Extra breathing room
        │       └─ Device notch/status bar
        └─ TopBar height (52px mobile, 56px desktop)
```

This plan preserves the premium design aesthetic while ensuring all UI elements are properly visible and don't overlap.

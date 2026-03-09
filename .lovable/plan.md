

# Round 7: Logo Unification, Favicon Fix, Notification Badge Fix, Landing Blur Cleanup & Swipeable Page Navigation

## Issues Identified

### 1. Logo Chaos — Three Different Logo Files Used
The app uses THREE different logo images in different places:
- **`/icons/s-logo-app.png`** — Used by `SwipessLogo.tsx` component (TopBar, Tutorial) and `PlaceholderImage.tsx`. This has a visible background/square.
- **`/icons/fire-s-logo.png`** — Used by splash screen in `index.html` and `manifest.webmanifest`. This is the correct Fire S logo.
- **`/assets/swipess-logo-transparent.png`** — Used by `LegendaryLandingPage.tsx` and `AppOutagePage.tsx`. This appears to be the old full wordmark.

**Fix:** Unify everything to use `fire-s-logo.png` as the single source of truth. Update `SwipessLogo.tsx` to import `fire-s-logo.png`. Update `PlaceholderImage.tsx` to reference `/icons/fire-s-logo.png`. Update landing page and outage page to use the same file.

### 2. Missing Favicon `<link>` Tag
The `index.html` has a comment `<!-- Favicon - SVG (modern browsers) + PNG fallbacks + ICO (legacy) -->` but **no actual `<link rel="icon">` tag**. This is why browsers show the old/default favicon.

**Fix:** Add proper favicon links pointing to `fire-s-logo.png`.

### 3. Logo Background Visible (Square Behind S)
The `SwipessLogo.tsx` component has `rounded-lg` on the image, which clips corners but still shows a square background if the PNG has one. The `s-logo-app.png` file likely has a non-transparent background.

**Fix:** Switch to `fire-s-logo.png` and remove `rounded-lg` class so it renders as a clean transparent icon.

### 4. Notification Badge Shows Wrong Count
The bottom nav Messages badge uses `useUnreadMessageCount` which counts **individual unread messages** across all conversations. If one conversation has 4 unread messages, the badge shows "4" even though there's only 1 conversation.

**Fix:** Change the query to count **conversations with unread messages** instead of individual messages. Group by `conversation_id` and count distinct conversations.

### 5. Landing Page Still Has `backdrop-blur-md` (3 instances)
The info chips, effects toggle button, and error modal in `LegendaryLandingPage.tsx` still use `backdrop-blur-md` and `backdrop-blur-sm`.

**Fix:** Replace with solid semi-opaque backgrounds.

### 6. Horizontal Swipe Between Bottom Nav Pages
The user wants to swipe left/right between the pages linked in the bottom navigation (Explore, Profile, Likes, Messages, Filters) instead of only tapping icons.

**Implementation:** Create a `useSwipeNavigation` hook that listens for horizontal swipe gestures on the main content area. When a swipe-left or swipe-right is detected (with threshold and velocity checks), navigate to the adjacent tab in the nav order. This is NOT a card effect — it's a simple page transition triggered by swipe gesture. The page content slides in from the appropriate direction using framer-motion page transitions.

**Key constraints:**
- Must not interfere with vertical scrolling
- Must not interfere with the swipe card deck on the Explore/Dashboard page
- Only activates on horizontal swipes with sufficient velocity and distance
- Uses the existing nav items array to determine prev/next page

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/SwipessLogo.tsx` | Switch from `s-logo-app.png` to `fire-s-logo.png`, remove `rounded-lg` |
| `src/components/PlaceholderImage.tsx` | Update logo path to `fire-s-logo.png` |
| `src/components/LegendaryLandingPage.tsx` | Use `fire-s-logo.png`, remove `backdrop-blur-md` (3 instances) |
| `src/components/AppOutagePage.tsx` | Use `fire-s-logo.png` instead of transparent asset |
| `index.html` | Add missing `<link rel="icon">` tags |
| `src/hooks/useUnreadMessageCount.tsx` | Count distinct conversations with unread messages, not individual messages |
| **NEW** `src/hooks/useSwipeNavigation.ts` | Hook to detect horizontal swipes and navigate between adjacent tabs |
| `src/components/DashboardLayout.tsx` | Integrate swipe navigation hook |

## Technical Details

### Notification Fix Query Change
```typescript
// BEFORE: counts individual unread messages
const { count } = await supabase
  .from('conversation_messages')
  .select('conversation_id', { count: 'exact', head: true })
  .in('conversation_id', conversationIds)
  .neq('sender_id', user.id)
  .eq('is_read', false);

// AFTER: counts distinct conversations with unread messages
const { data: unreadConvos } = await supabase
  .from('conversation_messages')
  .select('conversation_id')
  .in('conversation_id', conversationIds)
  .neq('sender_id', user.id)
  .eq('is_read', false);

const uniqueConversations = new Set(unreadConvos?.map(m => m.conversation_id));
return Math.min(uniqueConversations.size, 99);
```

### Swipe Navigation Hook
```typescript
// Detects horizontal swipes on touch devices
// Returns nothing — directly navigates on swipe detection
// Excludes swipe when touching elements with data-no-swipe-nav attribute
// Threshold: 80px horizontal distance OR 600px/s velocity
// Constraint: horizontal distance must exceed vertical (prevents scroll hijack)
```


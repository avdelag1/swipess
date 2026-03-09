

# Round 9: Full Frontend & Backend Audit

## Audit Findings

### CRITICAL Issues

**1. Dead File: `NotificationSystem.tsx` — Causes Duplicate Realtime Subscriptions**
`NotificationSystem.tsx` is NOT imported anywhere in the app (confirmed). However, `useNotifications.tsx` (used in `App.tsx` via `NotificationWrapper`) does the EXACT same thing: subscribes to `conversation_messages` INSERT events, fetches sender profile, shows toast + browser notification. Both create separate realtime channels listening to the same table. If `NotificationSystem` were ever re-imported, it would cause duplicate toasts. The file should be deleted as dead code.

**2. Triple Realtime Subscription to `conversation_messages`**
Three separate channels subscribe to `conversation_messages` INSERT events simultaneously:
- `useNotifications` (channel: `user-notifications`) — toast + push notification
- `useUnreadMessageCount` (channel: `unread-messages-count`) — badge count + notification sound
- `useNotificationSystem` (channel: `user-notifications-realtime`) — in-app notification panel

Each fires independently on the same INSERT event. This means for every new message, 3 separate Supabase realtime callbacks fire, each doing their own DB queries (fetch sender profile, fetch conversation). This is wasteful but functionally distinct — consolidation is a future optimization, not a bug.

**3. `console.log` in Production Code**
`src/integrations/supabase/client.ts` line 13 logs on every app init (even production). This file is auto-generated and CANNOT be edited. However, `src/state/swipeDeckStore.ts` line 87 also has a production `console.log` that should be removed.

### MODERATE Issues

**4. Duplicate OG/Twitter Meta Tags in `index.html`**
`og:title` appears at lines 78 AND 168. `twitter:title` appears at lines 96 AND 169. `og:description` at lines 79-80 AND 170-172. `twitter:description` at lines 97-98 AND 173. `twitter:image` at lines 99 AND 174-175. `twitter:card` at lines 94 AND 176. These duplicates confuse social media crawlers — only the last occurrence is used.

**5. Stale Logo Files in `/public/icons/`**
Multiple old logo files still exist: `s-logo-app.png`, `s-icon.jpg`, `swipess-logo-new.png`, `swipess-logo-script.png`, `swipess-logo-source.jpg`, `swipess-logo-square.png`. These add ~500KB+ to the build and are no longer referenced. Should be cleaned up.

**6. `backdrop-blur` Still in 99 Files**
Previous rounds cleaned a few files but 99 files still use `backdrop-blur`. The BottomNavigation component specifically uses a heavy 32px blur. This is a massive GPU drain on mobile devices. A full cleanup in one round is too large — should be prioritized by high-traffic components.

**7. `usePersistentReorder` Race Condition**
The hook reads from localStorage in two separate `useEffect` calls (lines 27-29 and 31-42). On first mount, both fire — the first sets `orderedIds` from storage, but the second also reads storage and may overwrite with stale data. This is a minor timing issue that could cause reorder to reset occasionally.

### LOW Issues

**8. `SavedSearches.tsx` Uses Hardcoded Dark Styling**
`src/components/SavedSearches.tsx` uses `bg-white/10`, `border-white/20`, `text-white/50` — doesn't respect light/dark theme.

**9. Swipe Navigation Missing `data-no-swipe-nav` on Reorder Groups**
The `Reorder.Group` components on liked pages allow vertical drag reorder, but the swipe navigation hook could interfere with horizontal touch gestures during reorder attempts.

---

## Plan — What to Fix

### 1. Delete Dead `NotificationSystem.tsx`
Remove the file entirely. No imports exist.

### 2. Fix Duplicate Meta Tags in `index.html`
Remove the duplicate `og:title`, `twitter:title`, `og:description`, `twitter:description`, `twitter:image`, `twitter:card` tags (lines 168-176). Keep the originals (lines 78-99).

### 3. Clean Production `console.log`
- `src/state/swipeDeckStore.ts` line 87: wrap in `import.meta.env.DEV` check

### 4. Delete Stale Logo Files
Remove unused logo files from `public/icons/`: `s-logo-app.png`, `s-icon.jpg`, `swipess-logo-new.png`, `swipess-logo-script.png`, `swipess-logo-source.jpg`, `swipess-logo-square.png`

### 5. Add `data-no-swipe-nav` to Reorder Groups
Add the attribute to `Reorder.Group` in `ClientLikedProperties.tsx`, `LikedClients.tsx`, `OwnerInterestedClients.tsx`, `ClientWhoLikedYou.tsx` to prevent swipe navigation from interfering with drag reorder.

### 6. Fix `SavedSearches.tsx` Theme
Replace hardcoded `bg-white/10` and `border-white/20` with theme-aware classes.

### 7. High-Priority `backdrop-blur` Cleanup
Replace `backdrop-blur` in the 5 most-used components:
- `BottomNavigation.tsx` (every page, heavy 32px blur)
- `TopBar.tsx` (every page)
- `toast.tsx` (every toast notification)
- `PropertyManagement.tsx` (owner listings page)
- `PropertyListingForm.tsx` (listing creation)

---

## Summary

| Fix | Impact | Files |
|-----|--------|-------|
| Delete dead NotificationSystem.tsx | Code hygiene, prevent future duplicate bugs | 1 |
| Fix duplicate meta tags | SEO/social sharing | 1 |
| Clean production console.log | Console cleanliness | 1 |
| Delete 6 stale logo files | ~500KB build savings | 6 files deleted |
| Add data-no-swipe-nav to reorder groups | Prevent gesture conflicts | 4 |
| Fix SavedSearches theme | Light mode support | 1 |
| High-priority backdrop-blur cleanup | GPU performance on mobile | 5 |

**Total: ~19 file operations (7 edits, 7 deletions, 5 blur cleanups)**
**Zero functional changes — pure cleanup, performance, and correctness**


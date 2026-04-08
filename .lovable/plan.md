

## Plan: Unify All Notifications to Premium Top Banner Style

### Problem
The app has two notification systems running simultaneously:
1. **Sonner toasts** — gray boxes at the bottom of the screen (the "horrible design" you mentioned)
2. **NotificationBar** — the premium banner that slides in from left, sits at top, exits to the right (the one you like)

When you swipe right, the like IS being saved correctly and the other user IS receiving a notification. The issue is purely visual — swipe feedback and other app actions show the ugly gray sonner toast instead of your preferred top banner.

### What This Plan Does

**Replace every sonner toast in the app with the premium NotificationBar style.** All notifications — swipe confirmations, errors, conversation creation, refresh messages — will use the same left-to-right sliding banner at the top.

---

### Changes

#### 1. Create a unified `showAppNotification` helper
- New utility function that pushes notifications into the existing `notificationStore` (which feeds the `NotificationBar`)
- Supports all types: success, error, warning, info, like, message
- Auto-dismisses after 4 seconds (same as current NotificationBar behavior)
- One function replaces all `toast()`, `toast.success()`, `toast.error()` calls

#### 2. Replace all `toast` calls across the app (~10 files)
Files to update:
- `src/components/SwipessSwipeContainer.tsx` — swipe feedback, conversation creation, refresh
- `src/components/ClientSwipeContainer.tsx` — owner-side swipe feedback
- `src/hooks/useSwipeWithMatch.tsx` — error toasts on swipe failure
- `src/hooks/useSwipeUndo.tsx` — undo confirmation
- `src/hooks/useSwipeDismissal.tsx` — dismissal error
- `src/hooks/useAuth.tsx` — auth success/error messages
- `src/hooks/useActiveMode.tsx` — mode switch feedback
- `src/hooks/useConversations.tsx` — conversation errors
- `src/hooks/useProfileSetup.tsx` — profile setup feedback
- `src/utils/notifications.ts` — the preset notification helpers

Each `toast.success(...)` becomes `showAppNotification({ type: 'success', title: ..., message: ... })`.

#### 3. Hide the sonner Toaster (optional cleanup)
- Remove or hide the `<Toaster />` component from the app layout since nothing will call it anymore
- Keeps the NotificationBar as the sole notification UI

### What stays the same
- The NotificationBar component itself — no changes needed, it already has the premium slide-in/slide-out behavior
- The real-time notification system for likes/matches — already working
- Swipe save logic — already saving to database correctly
- User-to-user connectivity — listings and profiles are already visible across users via the shared pool architecture

### Files Modified
1. `src/utils/appNotification.ts` — NEW: unified notification helper
2. `src/components/SwipessSwipeContainer.tsx` — replace toast calls
3. `src/components/ClientSwipeContainer.tsx` — replace toast calls
4. `src/hooks/useSwipeWithMatch.tsx` — replace toast calls
5. `src/hooks/useSwipeUndo.tsx` — replace toast calls
6. `src/hooks/useSwipeDismissal.tsx` — replace toast calls
7. `src/hooks/useAuth.tsx` — replace toast calls
8. `src/hooks/useActiveMode.tsx` — replace toast calls
9. `src/hooks/useConversations.tsx` — replace toast calls
10. `src/hooks/useProfileSetup.tsx` — replace toast calls
11. `src/utils/notifications.ts` — replace toast calls with store-based approach
12. `src/components/AppLayout.tsx` — remove sonner `<Toaster />` render


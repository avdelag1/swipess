

## Push Notifications Fix Plan

### Problem Analysis
After investigating the codebase, I found **two critical issues** preventing push notifications from working:

1. **Subscription Not Being Saved**: The `PushNotificationPrompt.tsx` component only calls `Notification.requestPermission()` but **never calls the `subscribe()` function** from `usePushNotifications` hook. This means the subscription (endpoint, keys) never gets saved to the `push_subscriptions` table.

2. **Wrong Icon Paths**: The edge function references non-existent icon files:
   - `/icons/icon-192x192.png` → should be `/icons/icon-192.png`
   - `/icons/badge-72x72.png` → should be `/icons/apple-touch-icon-72x72.png`

### What's Already Working
- ✅ `push_subscriptions` table with proper RLS
- ✅ Service worker with push event handlers (`sw.js`)
- ✅ Edge function `send-push-notification` (needs icon path fix)
- ✅ VAPID secrets configured
- ✅ `usePushNotifications` hook with `subscribe()` method
- ✅ Trigger points in match/notification code

---

### Implementation Steps

#### 1. Fix PushNotificationPrompt.tsx
Update the component to use the `usePushNotifications` hook's `subscribe()` method instead of just browser permission:

```tsx
// Add usePushNotifications hook
const { subscribe, isSubscribed, isSupported } = usePushNotifications();

const handleEnableNotifications = async () => {
  const success = await subscribe(); // This handles permission + saves to DB
  if (success) {
    toast.success("Notifications Enabled!");
  }
};
```

#### 2. Fix Icon Paths in Edge Function
Update `supabase/functions/send-push-notification/index.ts`:
```typescript
icon: icon || "/icons/icon-192.png",
badge: "/icons/apple-touch-icon-72x72.png",
```

#### 3. Add Settings UI Integration
Check if there's a settings page to enable/disable notifications and ensure it also uses the `subscribe()` method.

---

### Technical Details

```text
Current Flow (Broken):
┌─────────────────┐     ┌──────────────────┐
│ PushPrompt.tsx  │ ──► │ Browser Permission│  ← STOPS HERE
└─────────────────┘     └──────────────────┘

Fixed Flow:
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ PushPrompt.tsx  │ ──► │ usePushNotifications │ ──► │ PushManager.subscribe │ ──► │ Save to DB │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └──────────────────┘
```

### Files to Modify
1. `src/components/PushNotificationPrompt.tsx` - Use proper hook
2. `supabase/functions/send-push-notification/index.ts` - Fix icon paths
3. Any settings page that has notification toggle

### After Fix Testing
Once implemented, we can test live by:
1. Logging in
2. Enabling notifications via the prompt or settings
3. Checking `push_subscriptions` table for new entry
4. Triggering a match or message to see if notification arrives


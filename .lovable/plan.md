

## Plan: Fix Build Errors + iOS-Style Subscription UI

### Problem 1: Build Errors in `usePushNotifications.ts`

Three TypeScript errors caused by the recent refactor to support native Capacitor push:

1. **Lines 62 & 125** — The `push_subscriptions` table requires `auth` and `p256dh` as non-nullable strings. The native registration (line 62) omits them entirely, and the upsert format triggers a type mismatch.
2. **Line 118** — `applicationServerKey` receives `Uint8Array<ArrayBufferLike>` but TypeScript expects `BufferSource` backed by `ArrayBuffer`.

**Fix:**
- Native upsert (line 62): Add placeholder values for `auth` and `p256dh` (e.g., `'native'`) since native push uses FCM/APNS tokens, not VAPID keys.
- Web upsert (line 125): Ensure `p256dh` and `auth` are cast to `string` with fallback defaults.
- Line 118: Cast `urlBase64ToUint8Array(...)` result buffer explicitly: `new Uint8Array(appServerKey.buffer as ArrayBuffer)`.

### Problem 2: iOS-Style Subscription Buttons/Sections

Referencing the uploaded image (rent-a-mac pricing UI), upgrade `SubscriptionPackages.tsx` to use clean, iOS-native-feeling selection cards:

- **Segmented billing cycle selector** — horizontal row of tappable pills (like the "Daily / Weekly / Monthly" row in the reference), with a highlighted "POPULAR" badge.
- **Included features section** — clean two-column grid with green checkmarks and concise labels, matching iOS settings-style layout.
- **Bold price display** — large centered price with "Billed monthly/yearly" subtitle.
- **Full-width CTA button** — large rounded blue/gradient button ("Subscribe Now") with proper iOS touch target (48px+).
- Replace the current 3-card horizontal layout with a single active plan view + segmented plan switcher at top for cleaner mobile UX.

### Files to Modify

| File | Changes |
|---|---|
| `src/hooks/usePushNotifications.ts` | Fix all 3 TypeScript errors |
| `src/components/SubscriptionPackages.tsx` | Redesign to iOS-style segmented plan selector with bold CTA |

### Approach
1. Fix the build errors first to unblock deployment.
2. Redesign the subscription UI with the segmented selector pattern, maintaining all existing PayPal URLs and plan data.
3. Preserve the celebration flow on payment return (already implemented in `PaymentSuccess.tsx`).


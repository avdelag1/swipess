
## Full Performance & Flow Audit: What Needs Fixing

This is a complete diagnosis of every issue causing build errors, blinking between pages, and anything that would prevent a smooth iOS app experience.

---

## Part 1: Build Errors (Must Fix First — App Won't Compile)

### Error Group A: `send-push-notification` Edge Function (4 TypeScript errors)

**Root cause:** The Deno TypeScript runtime uses stricter `BufferSource` types than the edge function code expects. `Uint8Array<ArrayBufferLike>` is not assignable to `ArrayBufferView<ArrayBuffer>` in Deno's type system.

**Fix:** Cast the `Uint8Array` results to `ArrayBuffer` using `.buffer as ArrayBuffer` and fix the `importKey` call from `"raw"` (for EC keys, you need `"pkcs8"` or `"jwk"` format, not `"raw"` for private keys). The correct approach for VAPID private keys is to import them as `"pkcs8"`.

**Files to fix:**
- `supabase/functions/send-push-notification/index.ts`
  - Line 66: `crypto.subtle.importKey("raw", privateKeyBytes, ...)` — EC P-256 private keys must be imported as `"pkcs8"`, not `"raw"`. The VAPID private key must be converted from base64url raw bytes to a PKCS8-wrapped key, OR use `"jwk"` format.
  - Line 102: `urlB64ToUint8Array(p256dhKey)` result needs `.buffer as ArrayBuffer`
  - Line 142: `salt: authBytes` — needs `authBytes.buffer as ArrayBuffer`
  - Line 220: `body` — needs `body.buffer as ArrayBuffer`

**Simplest fix:** Replace the complex manual VAPID/Web Crypto implementation with the standard `web-push` compatible approach, casting `Uint8Array` to `Uint8Array<ArrayBuffer>` by reconstructing them from their `.buffer`:
```ts
new Uint8Array(urlB64ToUint8Array(p256dhKey).buffer)
```

### Error Group B: `usePushNotifications.ts` (6 TypeScript errors)

**Root cause:** The TypeScript DOM lib used in this Vite project does not include `PushManager` on the `ServiceWorkerRegistration` type. This is a missing lib type, not a runtime error.

**Fix:** Add `"lib": ["DOM", "DOM.Iterable", "ESNext"]` to `tsconfig.app.json` if not already there, OR use type assertions `(registration as any).pushManager`. The `push_subscriptions` table error (`Argument of type '"push_subscriptions"' is not assignable to parameter of type 'never'`) means the table exists but is not in the auto-generated `types.ts`. Since we cannot edit `types.ts`, we need to use `.from('push_subscriptions' as any)`.

---

## Part 2: Page-to-Page Blinking (The Visual Issue)

### Diagnosed Root Cause: Missing `AnimatePresence` + No Page Transition in the Router

Looking at `App.tsx` and `DashboardLayout.tsx`:

- `App.tsx` has a `<Suspense fallback={<SuspenseFallback />}>` wrapping all routes — but when lazy components load for the first time, the `SuspenseFallback` flashes white/blank briefly.
- There is **no `AnimatePresence` wrapping the `<Routes>`** in `App.tsx`. Pages swap with a hard cut — no crossfade, no continuity.
- `DashboardLayout.tsx` renders `{enhancedChildren}` (the `<Outlet>`) directly into the `<main>` tag with **no transition wrapper**. Every page swap is a hard DOM replacement.
- The `<SuspenseFallback>` component likely shows a loading spinner or blank screen — this is the "blinking" between pages.

### Fix Plan

**Fix 1: Add `AnimatePresence` + `useLocation` key to the Routes in `App.tsx`**

Wrap `<Routes>` in `AnimatePresence` keyed by `location.pathname`. This gives React Router a DOM key to animate between route changes. Each route change crossfades instead of hard-cutting.

```tsx
// In App.tsx — wrap the Routes with AnimatePresence
const location = useLocation();

<AnimatePresence mode="sync" initial={false}>
  <Routes location={location} key={location.pathname}>
    ...
  </Routes>
</AnimatePresence>
```

**Fix 2: Wrap each page's root element with a lightweight fade transition in `DashboardLayout`**

Since the `Outlet` renders child pages inside the `<main>` scroll container, add a motion wrapper around the outlet with a simple opacity transition. This eliminates hard cuts between pages.

Inside `DashboardLayout.tsx`, wrap the `enhancedChildren` output:

```tsx
<motion.div
  key={location.pathname}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.15, ease: 'easeOut' }}
  style={{ minHeight: '100%' }}
>
  {enhancedChildren}
</motion.div>
```

**Fix 3: Make `SuspenseFallback` invisible (transparent) instead of showing a spinner**

The flash between pages often comes from the `<SuspenseFallback>` showing briefly. For already-visited pages (which are cached in the JS bundle), Suspense resolves in <1ms but still shows the fallback for one frame. Change the fallback to `null` or a fully transparent div so even if it flashes, it's invisible.

**Fix 4: Increase `staleTime` for hot-path queries**

The `queryClient` has `staleTime: 5 * 60 * 1000` (5 min). This is already good. However `refetchOnWindowFocus: true` means every time the user switches tabs/apps on iOS it will refetch — this can cause visible content flashes when data reloads. For iOS, set `refetchOnWindowFocus: false` for most queries.

---

## Part 3: iOS-Readiness Checklist

### Things already done correctly:
- Capacitor dependencies are installed (`@capacitor/core`, `@capacitor/ios`, etc.)
- Safe area CSS variables (`--safe-top`, `--safe-bottom`) are properly defined
- `touch-action: manipulation` is set globally (eliminates 300ms tap delay)
- `-webkit-tap-highlight-color: transparent` is set
- `WebkitOverflowScrolling: 'touch'` is on the scroll container
- PWA manifest is configured

### Things that need attention for iOS:
- **Push notifications:** The `usePushNotifications` hook uses Web Push API which does NOT work in iOS WebView (Capacitor). iOS requires APNs (Apple Push Notification Service) via Capacitor's `@capacitor/push-notifications` plugin, not `PushManager`. The current implementation will silently fail on iOS. The hook should detect the Capacitor platform and skip Web Push.
- **`navigator.serviceWorker` in Capacitor:** Service workers don't run in iOS WKWebView. The push notification code should be guarded with `Capacitor.isNativePlatform()` checks.

---

## What Gets Fixed

### File Changes

**1. `supabase/functions/send-push-notification/index.ts`**
- Fix `Uint8Array` casting issues with `ArrayBuffer`
- Fix the private key import: EC P-256 private keys must use `"pkcs8"` format, not `"raw"`. Convert the raw bytes to a PKCS8 DER-encoded wrapper before importing.
- Fix `body` to cast to `ArrayBuffer` for the fetch call

**2. `src/hooks/usePushNotifications.ts`**
- Add `as any` type assertions for `push_subscriptions` table (not in generated types)
- Add `(registration as any).pushManager` to fix the missing DOM type
- Add Capacitor platform guard: skip all Web Push logic when running in native iOS/Android

**3. `src/App.tsx`**
- Extract `useLocation()` (move `AnimatePresence` inside a child component since hooks can't be used directly in the App root before `BrowserRouter`)
- Add `AnimatePresence mode="sync"` around the `<Suspense>` + `<Routes>` block

**4. `src/components/DashboardLayout.tsx`**
- Add lightweight `motion.div` with opacity fade around `{enhancedChildren}` keyed by `location.pathname`
- Import `motion` from `framer-motion` (it's already a dependency)

**5. `src/components/ui/suspense-fallback.tsx`**
- Make the fallback invisible during navigation (no spinner, just transparent) to eliminate the blink flash

**6. `tsconfig.app.json`**
- Ensure `"lib"` includes `"DOM"` to get `PushManager` types (if not already there)

---

## Priority Order

1. Fix build errors (Groups A + B) — app won't compile without this
2. Fix page blinking (`AnimatePresence` + `DashboardLayout` motion wrapper)
3. Fix iOS push notifications guard (Capacitor platform check)
4. Make `SuspenseFallback` invisible during transitions

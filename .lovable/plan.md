# Apple Rejection Fix Plan (Submission 5b528dea)

Three blockers from Apple. We tackle them in order of effort: text fix, bug fix, then real IAP.

## 1. Microphone Purpose String (Guideline 5.1.1)

Current text is generic ("Swipess needs microphone access for voice-to-text messaging with the AI concierge.") — Apple wants benefit + concrete example.

Update both sources of truth so `npx cap sync` and the post-sync patch agree:

- `capacitor.config.ts` → `ios.infoPlist.NSMicrophoneUsageDescription`
- `scripts/patch-ios-plist.cjs` → same key in `REQUIRED`

New text:
> "Swipess uses the microphone so you can dictate messages to the AI concierge and record voice notes on listings. For example, say 'Show me 2-bedroom apartments under $1500' and Swipess will search for you."

After approval the user will need to run `npx cap sync ios` locally (or rely on the patch script in `ios:sync`) before archiving.

## 2. "Buy" Error on Premium Plans (Guideline 2.1)

Root cause: `src/utils/nativeBridge.ts` `purchaseProduct` is a stub that returns `{ success: true }` without ever invoking StoreKit. On the reviewer's device, the Web fallback path in `TokensModal.tsx` / `SubscriptionPackagesPage.tsx` either:
- opens an external PayPal URL (rejected by Apple under 3.1.1), or
- hits the "Payment unavailable" toast when no `paypal_link` exists.

Either way the reviewer saw an error. Fix is the same as item 3 — implement real IAP — plus removing the external-URL fallback on iOS so no error toast or external browser is shown.

Interim hardening regardless of IAP work:
- In `TokensModal.handlePurchase`, `TokensModal.handlePremiumPurchase`, and `SubscriptionPackagesPage` purchase handlers, wrap the call in try/catch and surface a friendly NotificationBar instead of a destructive toast.
- Never call `window.open(paypal_link)` when `Capacitor.isNativePlatform()` — gate the whole web fallback behind `!NativeBridge.isNative()`.

## 3. Real Apple In-App Purchase (Guideline 3.1.1)

The current flow mocks StoreKit; Apple requires real IAP for digital goods.

### Plugin
Add `cordova-plugin-purchase` (works through Capacitor, maintained, supports StoreKit 2 + Google Play Billing). Install:
```
npm i cordova-plugin-purchase
npx cap sync
```

### Product IDs
We already reference `Swipess.tokens.{n}` and `plan.appleProductId`. Consolidate the canonical list in a new `src/config/iapProducts.ts`:

- Subscriptions: `swipess.premium.monthly`, `swipess.premium.yearly`, `swipess.premium.lifetime`
- Consumables (tokens): `swipess.tokens.50`, `.250`, `.1000`, etc. (must match `subscription_packages.message_activations` rows)

User must create matching products in App Store Connect → In-App Purchases.

### IAP service
Replace stub `purchaseProduct` / `restorePurchases` in `src/utils/nativeBridge.ts` and `src/hooks/useIAP.ts` with a real implementation in a new `src/lib/iap/StoreKitService.ts`:

- `init()` registers all product IDs with `CdvPurchase.store`, sets validator endpoint, calls `store.initialize([Platform.APPLE_APPSTORE])`.
- `purchase(productId)` → returns a Promise resolving when the `approved → verified → finished` lifecycle completes; rejects on `cancelled` or `error`.
- `restore()` → calls `store.restorePurchases()` and resolves once all owned products re-emit `verified`.
- Listens to `productUpdated` to keep a Zustand store of owned entitlements.

Initialise once in `RootProviders.tsx` behind `Capacitor.isNativePlatform()`.

### Server-side receipt validation
Create edge function `supabase/functions/validate-apple-receipt/index.ts`:
- Accepts `{ receipt, productId, userId }`.
- Verifies with Apple's `verifyReceipt` (production → fall back to sandbox on 21007).
- On success, upserts into `subscriptions` (for plans) or increments `message_activations` (for token packs) using a service-role client.
- Returns `{ ok: true, entitlement }`.

Store secret `APPLE_SHARED_SECRET` (from App Store Connect → App Information → App-Specific Shared Secret).

Wire `StoreKitService` validator to call this function; only mark the transaction `finished` after the function returns ok.

### UI integration
- `TokensModal.handlePurchase` and `SubscriptionPackagesPage` purchase handler: replace `NativeBridge.purchaseProduct(...)` with `StoreKitService.purchase(productId)`.
- Remove `window.open(paypal_link)` and Stripe/PayPal buttons entirely on iOS native builds. (Web build can keep PayPal/Stripe.)
- Add a visible "Restore Purchases" button on the subscription page (Apple requires it) calling `StoreKitService.restore()`.

### Database
Add migration:
- `apple_transactions` table: `id (uuid)`, `user_id`, `product_id`, `original_transaction_id (unique)`, `purchase_date`, `expires_date`, `environment`, `raw jsonb`, RLS owner-only select, service-role insert.
- Index on `original_transaction_id` for idempotency.

## Files to Change

- `capacitor.config.ts` — new mic string
- `scripts/patch-ios-plist.cjs` — new mic string
- `src/utils/nativeBridge.ts` — real StoreKit calls
- `src/hooks/useIAP.ts` — back with real plugin
- `src/lib/iap/StoreKitService.ts` — new
- `src/config/iapProducts.ts` — new
- `src/components/TokensModal.tsx` — gate web fallback, use service, error UX
- `src/components/SubscriptionPackages.tsx` + `src/pages/SubscriptionPackagesPage.tsx` — same; add Restore button
- `src/providers/RootProviders.tsx` — init store on native
- `supabase/functions/validate-apple-receipt/index.ts` — new
- migration for `apple_transactions`
- `package.json` — add `cordova-plugin-purchase`

## What the User Must Do After Code Lands

1. Add `APPLE_SHARED_SECRET` secret in Lovable Cloud.
2. Create the IAP products in App Store Connect with the IDs above.
3. Locally: `git pull && npm i && npx cap sync ios && open ios/App/App.xcworkspace`.
4. Test in Sandbox with a sandbox Apple ID, then archive and resubmit.
5. Reply to App Review noting all 3 items addressed.

## Non-Goals

- Keep web Stripe/PayPal flows for the browser build (Apple rules don't apply there).
- No changes to swipe physics, listings flow, or branding.

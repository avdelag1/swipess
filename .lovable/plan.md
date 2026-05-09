# Store Readiness Plan — Apple App Store + Google Play

Goal: Get Swipess to a state where Apple and Google reviewers are likely to approve it on first or second submission. After that, do a polish/perf pass on the rest of the app.

## Phase 1 — Hard blockers (must fix before submission)

These are the items that reliably get apps rejected. We address them first.

### 1. Sign in with Apple (Apple Guideline 4.8)
- Currently the app offers Google login. iOS apps that offer any third-party login MUST also offer Sign in with Apple.
- Add Apple as a provider via Lovable Cloud managed social auth.
- Add an "Apple" button to the auth screen alongside Google.

### 2. Account deletion in-app (Apple 5.1.1(v), Google Data safety)
- Both stores require users to delete their account from inside the app (not just a website).
- Add a "Delete my account" flow under Settings: confirmation modal, edge function that deletes auth user + cascades profile/listing/likes/messages rows, sign out, redirect.

### 3. Privacy Policy + Terms of Service URLs
- Required for store listings, auth screens, and Google Data Safety form.
- Verify `/privacy` and `/terms` routes exist, are reachable on the published domain, and are linked from the auth screen and Settings.
- Will not rewrite legal copy — just confirm pages exist and are linked.

### 4. Permission usage strings (iOS Info.plist / Android manifest)
- Capacitor app needs human-readable purpose strings for every permission used: camera, photo library, location, microphone (radio/voice), notifications.
- Audit `capacitor.config.ts`, `ios/App/App/Info.plist`, `android/app/src/main/AndroidManifest.xml`. Add `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription`, `NSMicrophoneUsageDescription` with clear, user-facing reasons. Same on Android side.

### 5. App Tracking Transparency (iOS 14.5+)
- If we use any analytics/tracking, add ATT prompt + `NSUserTrackingUsageDescription`. If we don't track across apps, declare that in App Privacy. Confirm which case applies.

### 6. Content moderation + reporting (Apple 1.2 for UGC apps)
- Swipess has user-generated profiles, photos, listings, messages. Apple requires:
  - A way to report objectionable content (already partially exists — `Flag` icon on cards). Verify the report flow actually writes to a `reports` table and notifies an admin.
  - A way to block users.
  - A method to filter objectionable content.
  - A published EULA or use Apple's standard EULA.
  - 24-hour response commitment to reports.
- Build/verify: report writes to DB, block-user action, admin review queue (can be minimal).

### 7. Age rating + age gate
- Set correct age rating in App Store Connect / Play Console questionnaire (likely 17+ given dating-style swipe + UGC).
- Add a date-of-birth or age confirmation step at signup.

### 8. Crash-free launch + no broken flows
- Capacitor build must launch on a clean device with no JS errors.
- Smoke-test: signup → upload photo → swipe → message → settings → delete account.
- Verify no `localhost`, dev-only URLs, or test keys in the production bundle.

## Phase 2 — Likely-to-be-flagged items

### 9. Network/CORS, splash, icons
- Confirm app icons (all required sizes) and splash screens are present in `ios/` and `android/`.
- Confirm `capacitor.config.ts` does NOT point `server.url` at the Lovable preview for production builds (that's only for dev hot-reload).

### 10. Push notifications
- If we declare push, we must actually request permission with a clear reason and have a working subscribe flow. If not used yet, do not declare it in capabilities.

### 11. Google Play Data Safety form
- Document every data type collected (email, name, photos, location, messages), purpose, whether shared, whether encrypted in transit, whether user can request deletion. Prepare a checklist the user can paste into Play Console.

### 12. Subscriptions / IAP
- If we sell digital tokens or subscriptions inside the iOS app, Apple requires IAP — we cannot use Stripe for in-app digital goods on iOS. Decide: either gate paid features to web only on iOS, or implement StoreKit. Mark as decision needed.

## Phase 3 — Polish after store readiness

Only after Phase 1 + 2 are clean:
- Performance pass: route-level code splitting audit, image lazy-loading audit, eliminate unused vendor weight, profile swipe deck FPS.
- Visual polish per the design evolution doctrine: shadow scaling, luminance layering, button sizing on swipe deck.
- Final QA: every primary flow on iPhone-size + Android-size viewports.

## Technical notes (for engineers)

- Apple sign-in: use `supabase--configure_social_auth` with `["apple"]`; add UI button using existing OAuth helper.
- Account deletion: edge function with service-role key, cascade deletes via SQL; client calls function then `signOut()`.
- Permission strings: edit `ios/App/App/Info.plist` and `android/app/src/main/AndroidManifest.xml` directly (not auto-generated).
- Reporting/blocking: add `reports` and `blocks` tables with RLS if not present; verify `Flag` button writes a row.
- Age gate: add `date_of_birth` column on profile if missing, validate >=17 (or appropriate) at signup.
- IAP decision needed before any subscription work on iOS.

## Open questions for you

1. Do you want me to add **Sign in with Apple** now? (Required for iOS approval.)
2. Do you currently sell **anything inside the app on iOS** (tokens, premium)? This decides whether we need Apple IAP or can keep Stripe (web-only on iOS).
3. Any **analytics/tracking SDKs** installed (Meta pixel, GA, etc.)? Decides ATT prompt.
4. Should I treat the app as **17+** (dating-style) or lower?

Once you answer (or say "you decide"), I'll switch to build mode and execute Phase 1 in order.

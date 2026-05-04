## Status of GitHub Mirror

Yes — the mirror workflow is now correctly configured:
- Reads `secrets.MIRROR_REPO_TOKEN1` (your renamed PAT)
- Uses `persist-credentials: false` on checkout so the bot token can't override your PAT
- Explicitly unsets the extraheader before pushing with `x-access-token:${MIRROR_TOKEN}`
- Triggers on every branch push + manual dispatch
- Force-pushes `HEAD:main` to `avdelag1/swipess`

Your screenshot confirms the latest run (#105 "Disabled bot checkout override", commit `40e4652`) finished green in 14s. Every change Lovable makes from now on will sync to the original repo automatically.

If a run ever fails again, the only realistic causes are:
1. PAT expired or its Contents permission removed
2. Branch protection on `avdelag1/swipess:main` blocking force-push
3. Repo renamed/moved (would require updating `MIRROR_TARGET_REPOSITORY` var)

---

## Apple App Store Readiness Plan

Goal: get Swipess through App Review on first submission, with the speed/smoothness/polish bar Apple expects. Work split into 5 focused passes.

### Pass 1 — Compliance (the things that get you rejected)
- Audit `capacitor.config.ts` Info.plist usage strings — make each one specific and user-benefit framed (Apple rejects vague "we need access" copy)
- Verify `PrivacyInfo.xcprivacy` declares every API actually used (UserDefaults, BootTime already there; add FileTimestamp/DiskSpace if used by image cache)
- Guideline 3.1.1 — confirm all paid features (subscriptions, tokens, perks) route through StoreKit on iOS via `NativeBridge`; hide/disable any Stripe/Paddle web checkout when `Capacitor.isNativePlatform()`
- Guideline 5.1.1 — Account deletion must be reachable in-app within 2 taps from settings; confirm `useDeleteAccount` is wired into Client + Owner settings
- Guideline 4.0 — replace any remaining web-only paradigms (hover-only states, right-click menus) with tap equivalents
- Add "Sign in with Apple" alongside Google (required when any third-party social login is offered)
- Verify ATT prompt is NOT shown (we don't track) and `NSPrivacyTracking=false` stays accurate

### Pass 2 — Performance & Smoothness (what reviewers feel)
- Cold start budget: <1.5s to first interactive frame on iPhone 12
  - Audit `RootProviders` + `App.tsx` for synchronous heavy imports; push to `lazyWithRetry`
  - Confirm splash screen hides only after first paint (Capacitor `SplashScreen.launchShowDuration: 0` is good)
- Swipe deck 60fps lock
  - Verify `RecyclingCardStack` keeps DOM node count ≤3 cards
  - Confirm `useDeviceParallax` is frozen during drag (per memory rule)
  - Image preload via `ImagePreloadController` covers next 2 cards
- List/scroll smoothness: ensure all long lists use windowing or `content-visibility: auto`
- Network: confirm Supabase realtime channels close on route unmount (avoid background drain)

### Pass 3 — Design Polish (the "looks expensive" pass)
Following the SBEP doctrine in project knowledge:
- Luminance layering audit across all surfaces (`#050505 → #0A0A0A → #111111`) — replace any pure `bg-black`
- Shadow elevation scaling — verify modals use 60px blur, primary actions 24px, floating 12px
- Swipe action buttons sized 64–72px with 28–32px icons (per memory)
- Typography hierarchy: 28–32px titles, 14–16px metadata, opacity-based whites (not gray)
- Tap feedback: confirm `pressAnimation` (scale 0.96/0.98) applied to every interactive element
- Cinematic card: bottom gradient on every swipe card for text legibility

### Pass 4 — Routes & Empty/Error States
Every route must handle: loading, empty, error, offline, unauthenticated. Sweep:
- Client routes: Dashboard, Discovery, Liked, WhoLikedYou, Messages, Profile, Settings, Filters, Perks, Contracts, Saved Searches, Security
- Owner routes: Dashboard, Properties, Interested, Liked, Messages, Profile, Settings, Filters, Contracts, Saved Searches, Security
- Shared: Eventos feed/detail/likes, Roommate, Radio, LocalIntel, PriceTracker, Notifications, Subscription, PaymentSuccess/Cancel, ResetPassword, NotFound
- Confirm `NotFound` is reachable and styled, not a default Vite page
- Confirm offline detection (`useOfflineDetection`) shows the unified `NotificationBar` everywhere

### Pass 5 — Build & Submission Readiness
- Run TypeScript check; fix any remaining errors (history shows `useMagnifier`/`DiscountHistory` were recent issues)
- Verify `npm run build` produces clean dist with vendor-react chunk intact
- Confirm `npx cap sync ios` works (you'll run this locally after pulling)
- Generate App Store screenshots set (6.7", 6.5", 5.5" required) — can be scripted from `/install` route
- Privacy policy + account deletion + support URLs live at `swipess.lovable.app` (already in `public/`)

---

### What I need from you to start
Pick the order. Suggested: Pass 1 (compliance) first since rejections there block everything, then Pass 2 (perf) since speed is your stated priority, then 3/4/5.

Reply "go" to start with Pass 1, or tell me which pass to lead with.
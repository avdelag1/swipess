

## iOS Native-Grade Upgrade for App Store Submission

### What We're Doing
Hardening the Capacitor iOS configuration, fixing safe-area handling, optimizing performance for native feel, and adding the required iOS privacy manifest -- all to ensure Apple accepts this app and it feels indistinguishable from native.

### Step 1: Optimize `capacitor.config.ts`
- Set `contentInset: 'always'` (enables proper safe-area rendering behind status bar)
- Set `scrollEnabled: false` (prevents WKWebView double-scroll conflicting with Framer Motion swipe cards)
- Add `allowsLinkPreviews: false` and `limitsNavigationsToAppBoundDomains: true`
- Set `SplashScreen.launchShowDuration: 0` (the web app renders fast enough -- no artificial delay)
- Add `StatusBar` plugin config with `style: 'dark'` and `backgroundColor: '#000000'`
- Add `Keyboard` plugin config with `resize: 'body'` and `scrollAssist: false` (prevents iOS keyboard push-up jank)

### Step 2: Add `PrivacyInfo.xcprivacy` 
Create `ios/App/App/PrivacyInfo.xcprivacy` -- Apple requires this since iOS 17. Declare:
- `NSPrivacyAccessedAPICategoryUserDefaults` (used by Capacitor/WKWebView for localStorage)
- `NSPrivacyAccessedAPICategorySystemBootTime` (used by Date/performance APIs)
- No tracking APIs declared (app doesn't use ATT)

### Step 3: Harden CSS for native iOS feel
In `src/index.css`:
- Add `-webkit-touch-callout: none` globally (prevents long-press context menus on images)
- Add `user-select: none` on interactive elements (buttons, cards) to prevent text selection during swipes
- Ensure `overscroll-behavior: none` on body to kill rubber-banding outside the app's own pull-to-refresh

### Step 4: Fix StatusBar initialization timing
In `src/main.tsx`, move the Capacitor StatusBar setup from the 15-second deferred init to a 1-second deferred init. Users currently see a white status bar for 15 seconds on cold launch before it turns dark. Move it to run immediately after first render.

### Step 5: Add `will-change: transform` to swipe cards
In `src/index.css`, add `will-change: transform` to `.swipe-card` class to hint the compositor for GPU layer promotion on older iPhones (iPhone SE, iPhone 11).

### Files to Modify
- `capacitor.config.ts` -- iOS-optimized config
- `ios/App/App/PrivacyInfo.xcprivacy` -- new file (Apple requirement)
- `src/index.css` -- native-feel CSS hardening
- `src/main.tsx` -- earlier StatusBar init

### What This Does NOT Change
- No routing, swipe physics, or layout architecture changes
- No Supabase/auth changes
- No component restructuring

## Goals

1. **Remove the breathing/zoom photo animation** everywhere except the Events (Eventos) feed pictures.
2. **Fix the press-and-hold zoom** on swipe cards so you can hold, see the photo magnified, and pan your finger across it freely.
3. **Kill every UI sound app-wide** (taps, welcome bell, swipe sounds, button "star shoot" pops on sign-in/up, concierge welcome, etc.). The only place sound should still play is the **public landing/main page** background (the meditation singing bowls when tapping the cosmos background) — never on Sign In, Sign Up, or anywhere inside the authenticated app.

---

## Changes

### 1. Breathing zoom — events only

- `src/components/CardImage.tsx` — remove the `breathing-zoom` / `photo-swim` animation entirely from the shared `CardImage`. Default `animate` prop to `false` so swipe decks (client + owner), filters preview, marketing slides, etc. show static photos.
- `src/components/SimpleOwnerSwipeCard.tsx` — its inline `CardImage` also currently runs `photo-swim`; strip that animation out.
- `src/components/events/EventCard.tsx` — pass `animate={true}` to `CardImage`, and inside `CardImage` honor that flag with the existing `breathing-zoom` keyframe (kept in `premium-polish.css`). This is the **only** surface that retains the slow zoom.

### 2. Press-and-hold zoom fix (`src/hooks/useMagnifier.ts`)

The hook activates on a 380 ms hold and tracks the finger via window-level `pointermove`, but two issues currently break it:

- The unified pointer handler in `SimpleSwipeCard` / `SimpleOwnerSwipeCard` calls `magnifierPointerHandlers.onPointerUp(e)` as soon as movement exceeds 18 px to start the drag — this kills the zoom before it can even activate, because users naturally micro-move while holding.
- `findImage()` grabs the first `<img>`, which can be the blur/LQIP placeholder, causing the transform to apply to the wrong element.

Fixes:
- In `SimpleSwipeCard.tsx` and `SimpleOwnerSwipeCard.tsx`: in `handleUnifiedPointerMove`, **only** convert to a drag if the magnifier hold timer hasn't fired AND the magnifier isn't active. If `isActive()` is true, route the move strictly to the magnifier (already done) and never tear it down. If the hold is pending and movement is small (< 25 px) keep waiting — don't cancel the hold prematurely.
- In `useMagnifier.ts`: target the actual photo via the `data-swipe-card-image="true"` attribute already added to the real `<img>` so the transform is applied to the correct element (skip blur placeholders).
- Keep the existing `pointercancel` ignore-while-active behavior so iOS callouts don't end the zoom; only `pointerup` (real finger lift) deactivates.
- Smooth pan: keep the RAF-batched `applyZoomPan` and the `transition: none` while moving (already in place), so the photo follows the finger 1:1.

### 3. Remove all in-app sounds; keep landing-page bowls only

Audit all `uiSounds.*` and notification-sound call sites and remove them, except inside `src/components/LandingBackgroundEffects.tsx` (the cosmos/sunset background that lives behind the marketing landing). Specifically:

- `src/components/AppLayout.tsx`
  - Remove the `useEffect` that calls `uiSounds.playWelcome()` on user login.
  - Remove the global `mousedown` handler that triggers `uiSounds.playTap()` on every interactive click.
  - Drop the `uiSounds` import.
- `src/components/LegendaryLandingPage.tsx` — strip every `uiSounds.playStarShoot()` call from the Sign In / Sign Up / back / toggle buttons (the buttons themselves stay, just no sound + no haptic-coupled sound trigger). Remove the `uiSounds` import.
- `src/components/ConciergeChat.tsx` — remove `uiSounds.playWelcome()` on chat open.
- `src/components/MessagingInterface.tsx` — remove `uiSounds.playTap / playMicOn / playMicOff / playNotification` calls.
- `src/components/ModeSwitcher.tsx` — remove `uiSounds.playSwitch()`.
- `src/components/DigitalSignaturePad.tsx` — remove `uiSounds.playPop()` / `playTap()`.
- `src/components/ClientVerificationFlow.tsx` — remove `uiSounds.playPop()` / `playPing()`.
- `src/components/OnboardingFlow.tsx` — remove `uiSounds.playStarShoot()`.
- `src/contexts/RadioContext.tsx` — remove `uiSounds.playStarShoot()` (radio audio playback itself stays).
- `src/hooks/useSwipeSounds.tsx` — make the hook a no-op (returns inert `playSwipeSound`) so swipe gestures are silent.
- `src/hooks/useUnreadMessageCount.tsx` — drop the `playNotificationSound` call so new-message bells stop firing.
- `src/components/MatchCelebration.tsx` — drop `playNotificationSound`.

Kept untouched (still play sounds — only on the public landing page surface):
- `src/components/LandingBackgroundEffects.tsx` — the cosmos/sunset tap sounds (`playStarShoot`, `playZenBowl`). Already gated behind its own `disableSoundsRef`. The user explicitly wants meditation bowls there.

The `uiSounds.ts` engine and the `/sounds/*.mp3` assets remain in the repo (used by the landing background and available if reintroduced later) — we just stop calling them from app surfaces.

---

## Acceptance check

- Swipe cards (client + owner) and the quick-filter card show **static** photos (no slow zoom).
- Eventos feed cards still gently breathe.
- Press-and-hold on a swipe card photo for ~0.4 s magnifies the image; sliding the finger pans the magnified view in real time; lifting the finger smoothly releases.
- Tapping anywhere inside the authenticated app — buttons, photos, swipe actions, mode switch, sign in/up form — produces **no audio**.
- Tapping the cosmic background on the public landing page still plays the singing-bowl / shooting-star sounds.
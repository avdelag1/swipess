

## Plan: Scroll-Hide Nav, Remove Owner Events, Center Cards, Add Voice Input

Four changes to implement.

### 1. Scroll-aware hide/show for TopBar and BottomNavigation

**Problem**: TopBar and BottomNavigation are rendered statically in `AppLayout.tsx` — they never hide on scroll.

**Solution**: Wrap both in the existing `SentientHud` component, which already uses `useScrollDirection` to hide on scroll-down and show on scroll-up/touch.

**File**: `src/components/AppLayout.tsx`
- Import `SentientHud`
- Wrap `<TopBar>` in `<SentientHud side="top">` with fixed positioning
- Wrap `<BottomNavigation>` in `<SentientHud side="bottom">` with fixed positioning
- The existing `useScrollDirection` hook handles: scroll down = hide, scroll up = show, touch = show, at top = always visible

### 2. Remove Events button from owner bottom nav only

**File**: `src/components/BottomNavigation.tsx`
- Remove the `{ id: 'events', icon: PartyPopper, label: 'Events', path: '/explore/eventos' }` entry from `ownerNavItems` array (line ~120)
- Client nav keeps its Events button untouched

### 3. Center dashboard category cards responsively

**Problem**: `PK_W` is hardcoded at 360px which can cause the card stack + arrow buttons to not center properly on different screen widths.

**File**: `src/components/swipe/SwipeAllDashboard.tsx` and `src/components/swipe/OwnerAllDashboard.tsx`
- Change the outer container to use `items-center justify-center w-full` with proper centering
- Make card width responsive: `min(PK_W, calc(100vw - 120px))` to account for the two arrow buttons + padding, ensuring the stack is always centered

**File**: `src/components/swipe/SwipeConstants.ts`
- Optionally reduce `PK_W` or keep it but let the container clamp it

### 4. Voice-to-text mic button in AI Concierge Chat

**Problem**: The voice input feature was discussed and approved but never implemented.

**File**: `src/components/ConciergeChat.tsx`
- Add a `Mic` icon button next to the text input (between textarea and send button)
- Use the browser's native `webkitSpeechRecognition` / `SpeechRecognition` API
- Tap to start: button pulses with a red glow, transcription fills the textarea in real-time via `onresult`
- Tap to stop: recognition ends, text stays in input for review
- Add an "auto-send" toggle (small switch/icon near the mic) that when ON, automatically sends the message after recognition ends
- Auto-send toggle state persisted in localStorage
- Graceful fallback: if browser doesn't support Speech API, hide the mic button

**New hook** (optional, can be inline): `useSpeechRecognition` — manages start/stop/transcript state

### Files to change

| File | Change |
|------|--------|
| `src/components/AppLayout.tsx` | Wrap TopBar + BottomNav in `SentientHud` |
| `src/components/BottomNavigation.tsx` | Remove Events from `ownerNavItems` |
| `src/components/swipe/SwipeAllDashboard.tsx` | Responsive centering for card stack |
| `src/components/swipe/OwnerAllDashboard.tsx` | Responsive centering for card stack |
| `src/components/ConciergeChat.tsx` | Add mic button, auto-send toggle, Web Speech API integration |




## Plan: Voice Auto-Send with 7-Second Countdown Timer

### Problem
Currently, when auto-send is ON and the user stops speaking, the message sends immediately when the speech recognition ends. There's no grace period for the user to gather their thoughts and continue speaking. We need a visible 7-second countdown after the user stops talking, giving them time to resume — and if they don't, auto-send fires.

### Changes

**1. Add countdown state and timer logic** (`ConciergeChat.tsx`)

New state: `countdown` (number | null) — when non-null, shows seconds remaining before auto-send.

After speech recognition detects silence (the `onend` event fires), instead of sending immediately:
- Start a 7-second countdown interval
- Each second, decrement the counter and update UI
- If the user speaks again (recognition restarts and fires `onresult`), cancel the countdown
- If the user taps the mic button to stop, cancel the countdown and leave the text in the input (no auto-send)
- If countdown reaches 0, send the message

**2. Visual countdown indicator**

Below the input area (or overlaid on the mic button), show a circular or linear countdown:
- Animated ring around the mic button that depletes over 7 seconds
- Text showing seconds remaining: "Sending in 5..."
- Tapping the countdown area cancels it and keeps the text

**3. Cancel-on-resume logic**

The key UX detail: if the user starts speaking again during the countdown, the countdown resets and disappears. The `onresult` handler clears the countdown timer. This makes it feel natural — pause to think, resume talking, no accidental sends.

### Files to modify

- **`src/components/ConciergeChat.tsx`** — All changes in this single file:
  - Add `countdown` state and `countdownRef` interval ref
  - Modify `recognition.onend` to start countdown instead of immediate send
  - Modify `recognition.onresult` to cancel any active countdown
  - Add countdown UI element (animated ring + "Sending in X..." label)
  - Cancel countdown on manual stop (mic button tap)

### UX Flow

```text
User taps mic → recording starts
User speaks → text appears in input
User pauses → silence detected → recognition.onend fires
  → If auto-send ON: countdown starts (7...6...5...4...3...2...1)
    → User speaks again? → countdown cancels, recording continues
    → User taps mic? → countdown cancels, text stays, recording stops
    → Countdown hits 0? → message auto-sends, recording stops
  → If auto-send OFF: text stays in input, recording restarts normally
```

### Visual Design

A subtle progress ring around the mic button with the countdown number centered. Matches the existing primary color palette. Small text below: "Sending in 5..." in `text-xs text-primary/70`.


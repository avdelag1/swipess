

## Plan: Fix Voice-to-Text Auto-Send Timing and Listening Issues

### Problems Identified

From the screenshot and description, three issues:

1. **Speech recognition dies during countdown** — `startCountdown()` calls `recognition.stop()`, which triggers `onend`, which sets `isListening = false`. The user can't speak during the 3-second countdown to reset it.

2. **Silence timer too short (2s) before countdown starts** — Combined with the 3s countdown, the user barely gets time to pause between thoughts. The silence detection fires too quickly.

3. **Duplicate text accumulation** — The `onresult` handler rebuilds `finalTranscript` from ALL results every time (loop from `i=0`), so older final results get re-concatenated, causing the "yeah I know I'm just testing" repetition seen in the screenshot.

### Fixes

**File: `src/components/ConciergeChat.tsx`**

**Fix 1: Don't stop recognition during countdown.** Remove `recognition.stop()` from `startCountdown()`. Instead, keep recognition alive so that if the user speaks during the countdown, the `onresult` handler detects new speech and resets the countdown. Add logic in `onresult`: if `isCountingDownRef.current` is true and new speech arrives, call `clearCountdown()` and reset the silence timer — giving the user another 2s of silence before the countdown restarts.

**Fix 2: Fix duplicate transcript accumulation.** Change the `onresult` handler to only process results from index `lastResultIndex + 1` onward for final results. Track cumulative final text properly so old finals aren't re-appended.

**Fix 3: Keep recognition alive in `onend`.** When `onend` fires and the user hasn't manually stopped AND there's no countdown, auto-restart recognition (the previous auto-restart was removed to fix duplicates, but it's needed — duplicates were caused by the transcript loop, not by restarting). Use a flag to distinguish user-initiated stop from browser-initiated end.

### Summary of behavior after fix

- User taps mic → recognition starts, listening continuously
- User speaks → text appears in input
- User pauses for 2 seconds → 3-second countdown begins
- **During countdown, if user speaks again** → countdown cancels, silence timer resets
- User stays silent through full countdown → ignition fires, message sends
- Text never duplicates because we track which result indices we've already processed


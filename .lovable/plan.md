

# Fix Radio Reliability + Shooting Star Timing

## Part 1: Radio — Why It Breaks After a Few Stations

Root causes identified:

1. **Dead station blacklist persists forever in localStorage** — once 6 errors accumulate for a station (even across sessions), it's permanently removed. Over time, most stations get blacklisted and the player runs out.
2. **`crossOrigin = "anonymous"` causes CORS failures** on many live radio streams. SomaFM doesn't always send `Access-Control-Allow-Origin` headers, so the browser blocks the stream. This is set for the visualizer — but it kills playback reliability. Fix: only set `crossOrigin` when AudioContext is actually initialized, and catch CORS failures gracefully.
3. **Stale closure in `play` callback** — depends on `[state.currentStation]` but calls `changeStation('next')` internally during error recovery. When rapid station switches happen, the closure captures an old station, causing the player to loop back to already-failed stations.
4. **Load timeout of 10 seconds** is too aggressive for live radio streams that buffer slowly. Some streams need 15+ seconds on mobile.

### Changes to `src/contexts/RadioContext.tsx`:
- Clear `swipess_radio_dead_stations` from localStorage on component mount (fresh start each session)
- Initialize `deadStationIds` as empty array `[]` instead of reading localStorage
- Remove `crossOrigin = "anonymous"` from the Audio element by default; only set it when AudioContext is successfully created (and wrap the visualizer in a try/catch)
- Increase load timeout from 10s to 15s
- Use refs instead of state for the `play` callback's station reference to avoid stale closures
- Reduce the "permanent dead" threshold from 6 to never — just use the temporary 30s blacklist, no permanent kills
- Remove `markStationAsDead` entirely — it's too destructive

### Changes to `src/types/radio.ts`:
- Keep `deadStationIds` in the type but it will always be `[]` now

---

## Part 2: Shooting Stars — Random 6-10 Second Intervals

### `src/components/LandingBackgroundEffects.tsx` (line 508-511):
- Replace fixed `3000`ms interval with a random delay between 6000-10000ms
- Track `nextAutoStarDelay` as a variable that re-randomizes after each spawn

### `src/pages/DJTurntableRadio.tsx` (line 58, 92):
- Change `nextShoot = 50 + Math.random() * 80` to frame-based equivalent of 6-10 seconds at 60fps
- That's `nextShoot = 360 + Math.random() * 240` (6s = 360 frames, 10s = 600 frames)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/contexts/RadioContext.tsx` | Remove permanent blacklist, clear dead stations, fix crossOrigin, fix stale closures, increase timeout |
| `src/components/LandingBackgroundEffects.tsx` | Random 6-10s shooting star interval |
| `src/pages/DJTurntableRadio.tsx` | Random 6-10s shooting star interval |


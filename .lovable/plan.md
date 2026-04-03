

## Fix Plan: Build Errors, Radio Mini-Player, and App Boot Speed

### Problems Identified

1. **Build errors** in `SwipessLogo.tsx` — `WebkitMaskMode` is not a valid React CSS property. Must be cast or removed.

2. **Radio mini-player won't stay closed** — In `RadioContext.tsx` line 299, when a station src changes, `miniPlayerMode` is unconditionally set to `'expanded'`, overriding the user's explicit `'closed'` choice.

3. **"Reload App" button still appearing** — The recovery timer in `index.html` fires at 3 seconds, but the `app-rendered` event from `RootProviders` may not fire until after all nested providers (Auth, Radio, etc.) have mounted. The 3-second window is too tight. Additionally, `window.__APP_INITIALIZED__` is only set by the `app-rendered` listener, so the initial timeout at line 261-272 always triggers first.

4. **Sluggish perceived boot** — The deep provider nesting (11+ levels) delays when `AppLifecycleManager` mounts and fires `app-rendered`. The splash/recovery system fights with this.

---

### Step 1: Fix SwipessLogo Build Errors

Remove the `WebkitMaskMode` properties (lines 67 and 86) — the standard `maskMode` property is sufficient, and `WebkitMask` shorthand already covers the mask definition. Alternatively, cast the style object as `any` to bypass TypeScript.

**Approach**: Remove both `WebkitMaskMode` lines since `maskMode` already handles it.

---

### Step 2: Fix Radio Mini-Player Close Persistence

In `RadioContext.tsx` line 294-301, change the `play()` function to respect the user's closed state:

```typescript
setState(prev => ({
  ...prev,
  currentStation: targetStation,
  currentCity: targetStation.city,
  miniPlayerMode: prev.miniPlayerMode === 'closed' ? 'closed' : 'expanded'
}));
```

This ensures closing the mini-player sticks even when stations change or auto-skip due to errors.

---

### Step 3: Fix Recovery UI / "Reload App" Button

**Root cause**: The 3-second timeout in `index.html` (line 261) fires before React can mount through 11+ provider layers. The `app-rendered` event hasn't fired yet, so recovery UI shows.

**Fix**:
- Increase the initial mount timeout from 3s to 6s in `index.html` (line 272)
- Fire `__APP_INITIALIZED__ = true` earlier — move the signal from `AppLifecycleManager` (deep in the provider tree) to immediately after `createRoot().render()` in `main.tsx`, since React rendering is synchronous
- Keep `app-rendered` for splash dissolution, but set `__APP_INITIALIZED__` immediately after render call to prevent recovery UI

Also in `main.tsx`, set `window.__APP_INITIALIZED__ = true` right after the `root.render()` call (line 81) so the recovery timer never triggers.

---

### Step 4: Speed Improvements

- In `AnimatedOutlet.tsx`: Remove the `startViewTransition` `useLayoutEffect` — it runs on every navigation and does nothing useful (the callback is empty), but it forces layout recalculation
- Ensure the `app-rendered` event fires as early as possible by simplifying the `AppLifecycleManager` effect

---

### Files to Edit

| File | Change |
|---|---|
| `src/components/SwipessLogo.tsx` | Remove `WebkitMaskMode` properties (2 lines) |
| `src/contexts/RadioContext.tsx` | Respect `'closed'` miniPlayerMode in `play()` |
| `index.html` | Increase mount timeout to 6s |
| `src/main.tsx` | Set `__APP_INITIALIZED__` immediately after render |
| `src/components/AnimatedOutlet.tsx` | Remove empty `startViewTransition` effect |


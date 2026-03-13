

# Fix Tap Sound Delay and Add Sequential Sound Playback

## Problems

1. **Sound delay on tap**: Every tap creates a `new Audio(src)` which must fetch/decode the file before playing. This causes a noticeable lag between the tap and the sound.
2. **Random repetition**: `pickRandom()` can pick the same sound consecutively, making it feel like nothing changes.

## Solution

### 1. Preload all sound pools as `HTMLAudioElement` arrays on mount
Instead of creating `new Audio()` on each tap (which fetches the file), preload all zen and jungle sound files into reusable `Audio` elements at module load time. On tap, just reset `currentTime = 0` and call `.play()` — this is near-instant.

### 2. Sequential round-robin instead of random
Replace `pickRandom()` with a module-level index counter per pool. Each tap advances to the next sound in order, wrapping around. This guarantees every sound plays before any repeats.

## Files to Modify

| File | Change |
|------|--------|
| `src/utils/sounds.ts` | Preload all sound pools into `Audio` elements at module level. Replace `pickRandom` with round-robin index for `playRandomZen`, `playJungleSound`, `playFunnyDislike`, `playFunnyLike`. Add `preloadPool()` helper and per-pool index counters. |
| `src/components/LandingBackgroundEffects.tsx` | Remove `unlockAudio()` from pointerdown (no longer needed since preloaded Audio elements handle this). Optionally keep it as a safety net but call sounds directly from preloaded refs. |

### Key code pattern (sounds.ts):
```typescript
// Preload pool into reusable Audio elements
function preloadPool(paths: string[], vol: number): HTMLAudioElement[] {
  return paths.map(p => { const a = new Audio(p); a.preload = 'auto'; a.volume = vol; a.load(); return a; });
}

const zenPool = preloadPool(soundMap.randomZen.sounds, 0.45);
let zenIndex = 0;

export function playRandomZen(volume = 0.45): void {
  if (!zenPool.length) return;
  const audio = zenPool[zenIndex % zenPool.length];
  audio.volume = volume;
  audio.currentTime = 0;
  audio.play().catch(() => {});
  zenIndex++;
}
```

Same pattern for `jungleSoundPool`, `funnyDislikePool`, `funnyLikePool` — each gets its own preloaded array and sequential index.


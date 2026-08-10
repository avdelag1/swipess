/**
 * iOS / WKWebView media unlock.
 * Unmuted playback (and sometimes even muted autoplay after a pause) only
 * succeeds inside a user gesture. Call these helpers from click/pointer handlers.
 */

let unlocked = false;
let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) {
    try {
      sharedCtx = new AC();
    } catch {
      return null;
    }
  }
  return sharedCtx;
}

/** Unlock the audio session (silent tick). Safe to call repeatedly. */
export function unlockMediaPlayback(): void {
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }
    if (!unlocked) {
      try {
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
      } catch {
        /* ignore */
      }
    }
  }
  unlocked = true;
}

/** Play a media element from inside a user gesture (unmute / tap-to-play). */
export function playMediaFromGesture(el: HTMLMediaElement | null | undefined): void {
  if (!el) return;
  unlockMediaPlayback();
  try {
    el.muted = el.muted;
    const p = el.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {
    /* ignore */
  }
}

export function isMediaUnlocked(): boolean {
  return unlocked;
}

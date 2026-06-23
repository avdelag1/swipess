/**
 * Shared recovery budget + helpers for chunk-load failures — the classic
 * "Failed to fetch dynamically imported module" cascade that hits users after a
 * production redeploy, when the running app shell references hashed chunks that
 * no longer exist on the server.
 *
 * WHY THIS EXISTS — the bug it fixes
 * ----------------------------------
 * The previous guards were ONE-SHOT per browser session and were never reset on
 * a healthy boot:
 *   • lazyRetry.ts  → `page-reloaded-on-chunk-fail` (a permanent boolean)
 *   • main.tsx      → `Swipess_emergency_reload_count` (capped at 1, never reset)
 *
 * A single session, however, can outlive SEVERAL deploys. Once the first
 * recovery reload "spent" the one allowed attempt, the NEXT stale-shell episode
 * (a later deploy shipped while the tab stayed open) could no longer recover —
 * every subsequent chunk error just logged "Max recovery attempts reached" /
 * "FAILED AFTER RELOAD" and stranded the user on a broken page.
 *
 * THE FIX — a TIME-WINDOWED budget
 * --------------------------------
 * Allow up to MAX_RELOADS within WINDOW_MS, auto-renewing once the app has
 * stayed healthy for a full window. Rapid loops are still capped (a genuinely
 * unrecoverable shell stops after a few tries instead of looping forever), but
 * every fresh deploy episode gets its own recovery budget.
 *
 * This deliberately SHARES storage with GlobalErrorBoundary (which already uses
 * this exact pattern) so that every auto-reload path — lazy import retry,
 * window `vite:preloadError`, and the React error boundary — draws from ONE
 * circuit breaker instead of three independent ones.
 */

// Shared with GlobalErrorBoundary so all auto-reload paths use a single budget.
const COUNT_KEY = 'swipess_global_reload_count';
const TS_KEY = 'swipess_global_reload_ts';
const WINDOW_MS = 60_000;
const MAX_RELOADS = 3;

/**
 * Reserve one recovery-reload slot. Returns `false` when the budget for the
 * current time window is exhausted — the caller should then STOP reloading and
 * surface the error (e.g. to the nearest ErrorBoundary) instead of looping.
 */
export function canAttemptRecoveryReload(): boolean {
  try {
    const now = Date.now();
    const lastTs = parseInt(sessionStorage.getItem(TS_KEY) || '0', 10);
    let count = parseInt(sessionStorage.getItem(COUNT_KEY) || '0', 10);
    // Healthy for a full window → the previous episode is over; renew the budget.
    if (now - lastTs > WINDOW_MS) count = 0;
    if (count >= MAX_RELOADS) return false;
    sessionStorage.setItem(COUNT_KEY, String(count + 1));
    sessionStorage.setItem(TS_KEY, String(now));
    return true;
  } catch {
    // sessionStorage blocked (private mode / sandboxed iframe): never block recovery.
    return true;
  }
}

/**
 * Best-effort teardown of the service worker + Cache Storage so the next load
 * pulls a completely fresh build. Each step is independently guarded and the
 * whole thing never rejects, so it is safe to race against a timeout.
 *
 * Unregistering the SW is the key step: HTML is served `no-store` (see
 * vercel.json), so once the SW is gone a single reload is guaranteed to fetch a
 * fresh shell pointing at the current chunk hashes.
 */
export async function clearStaleRuntimeCaches(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* best-effort */
  }
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* best-effort */
  }
}

/**
 * Cache-busted reload that PRESERVES existing query params — dropping them loses
 * in-progress flows (e.g. /owner/listings/new?category=…&fromAI=1).
 */
export function reloadForFreshBuild(): void {
  const params = new URLSearchParams(window.location.search);
  params.set('v', String(Date.now()));
  window.location.replace(window.location.pathname + '?' + params.toString());
}

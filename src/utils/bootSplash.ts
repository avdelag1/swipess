/**
 * Boot splash handshake.
 *
 * The static splash in index.html (driven by public/scripts/splash.js) covers
 * the screen at z-index 99999 until React signals it has painted real content.
 * That signal is the `swipess-ready` / `app-rendered` event pair.
 *
 * Historically only <AppLayout> (deep in the provider tree) and a safety timer
 * inside <AuthReadySignal> dispatched it. If anything ABOVE those short-circuits
 * — e.g. the connection guard rendering the offline screen, or a provider
 * throwing into the error boundary — the splash was never told to fade and the
 * 6s watchdog rewrote it to "Something went wrong. Tap below to recover."
 *
 * `markAppRendered()` is the single, idempotent way to fade the splash. It is
 * safe to call from every terminal render branch (layout, error boundary,
 * connection error screen) so the user always sees real, actionable UI instead
 * of the watchdog.
 */
export function markAppRendered(): void {
  if (typeof window === 'undefined') return;

  const w = window as unknown as Record<string, unknown>;
  if (w.__APP_READY_FIRED__) return;
  w.__APP_READY_FIRED__ = true;
  w.__APP_INITIALIZED__ = true;
  w.__APP_MOUNTED__ = true;

  try {
    window.dispatchEvent(new CustomEvent('swipess-ready'));
    window.dispatchEvent(new CustomEvent('app-rendered'));
  } catch {
    /* CustomEvent unsupported — splash watchdog will still fade on its own */
  }
}

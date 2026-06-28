import { useCallback, useSyncExternalStore } from 'react';

/**
 * Single-phase chrome reveal store for swipe dashboards.
 *
 * On reveal: TopBar + BottomNavigation + Card action rail all show together.
 * On auto-hide: all three fade together after AUTO_HIDE_CHROME_MS of idle.
 * Tapping the chrome summon zones (top/bottom edges) brings them back.
 */

const AUTO_HIDE_CHROME_MS = 4000; // header + bottom nav fade first
const AUTO_HIDE_RAIL_MS = 4500;   // right-side action rail fades 0.5s later

let chromeVisible = true;
let railVisible = true;
let chromeTimer: ReturnType<typeof setTimeout> | null = null;
let railTimer: ReturnType<typeof setTimeout> | null = null;
// Gate: on the dashboard deck the chrome must STAY up until the user picks a
// quick filter. While this is false, scheduleChromeHide() is a no-op, so the
// per-card revealChrome() calls just keep the chrome visible. Picking a filter
// flips it on (enableChromeAutoHide); entering the deck resets it off.
let autoHideEnabled = true;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function clearAllTimers() {
  if (chromeTimer) { clearTimeout(chromeTimer); chromeTimer = null; }
  if (railTimer) { clearTimeout(railTimer); railTimer = null; }
}

function scheduleChromeHide() {
  clearAllTimers();

  // Hold the chrome up until auto-hide is armed (i.e. a quick filter is picked).
  if (!autoHideEnabled) return;

  // Staggered fade: header + bottom nav first, then the right rail 0.5s later.
  chromeTimer = setTimeout(() => {
    chromeVisible = false;
    chromeTimer = null;
    emit();
  }, AUTO_HIDE_CHROME_MS);

  railTimer = setTimeout(() => {
    railVisible = false;
    railTimer = null;
    emit();
  }, AUTO_HIDE_RAIL_MS);
}

export function revealChrome() {
  clearAllTimers();
  const wasHidden = !chromeVisible || !railVisible;
  chromeVisible = true;
  railVisible = true;
  if (wasHidden) emit();
  scheduleChromeHide();
}

// Show the chrome and KEEP it up with no auto-hide. Used when the swipe deck
// first opens: the staggered auto-hide only begins once the user picks a quick
// filter (revealChrome is called from the category handler at that point).
export function showChromePersistent() {
  clearAllTimers();
  const wasHidden = !chromeVisible || !railVisible;
  chromeVisible = true;
  railVisible = true;
  if (wasHidden) emit();
}

// Arm the staggered auto-hide. Call this when the user picks a quick filter so
// the subsequent revealChrome() actually schedules the 3.5s / 4s fade.
export function enableChromeAutoHide() {
  autoHideEnabled = true;
}

// Disarm the auto-hide and cancel any pending fade (chrome stays visible).
// Call this when entering the dashboard deck so the chrome holds until a filter.
export function resetChromeAutoHide() {
  autoHideEnabled = false;
  clearAllTimers();
}

export function hideChrome() {
  clearAllTimers();
  const changed = chromeVisible || railVisible;
  chromeVisible = false;
  railVisible = false;
  if (changed) emit();
}

export function toggleChrome() {
  if (chromeVisible || railVisible) {
    hideChrome();
  } else {
    revealChrome();
  }
}

export function resetChrome() {
  clearAllTimers();
  chromeVisible = false;
  railVisible = false;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getChromeSnapshot() {
  return chromeVisible;
}

function getRailSnapshot() {
  return railVisible;
}

export function useChromeReveal() {
  const isChromeVisible = useSyncExternalStore(subscribe, getChromeSnapshot, getChromeSnapshot);
  const isRailVisible = useSyncExternalStore(subscribe, getRailSnapshot, getRailSnapshot);
  return {
    isChromeVisible,
    isRailVisible,
    revealChrome: useCallback(revealChrome, []),
    hideChrome: useCallback(hideChrome, []),
  };
}

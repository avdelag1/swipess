import { useCallback, useSyncExternalStore } from 'react';

/**
 * Single-phase chrome reveal store for swipe dashboards.
 *
 * On reveal: TopBar + BottomNavigation + Card action rail all show together.
 * On auto-hide: all three fade together after AUTO_HIDE_CHROME_MS of idle.
 * Tapping the chrome summon zones (top/bottom edges) brings them back.
 */

const AUTO_HIDE_CHROME_MS = 3000;

let chromeVisible = true;
let railVisible = true;
let chromeTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function clearAllTimers() {
  if (chromeTimer) { clearTimeout(chromeTimer); chromeTimer = null; }
}

function scheduleChromeHide() {
  if (chromeTimer) clearTimeout(chromeTimer);

  chromeTimer = setTimeout(() => {
    chromeVisible = false;
    railVisible = false;
    chromeTimer = null;
    emit();
  }, AUTO_HIDE_CHROME_MS);
}

export function revealChrome() {
  clearAllTimers();
  const wasHidden = !chromeVisible || !railVisible;
  chromeVisible = true;
  railVisible = true;
  if (wasHidden) emit();
  scheduleChromeHide();
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

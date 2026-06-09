import { useCallback, useSyncExternalStore } from 'react';

/**
 * Two-phase chrome reveal store for swipe dashboards.
 *
 * Phase 1 (isChromeVisible): TopBar + BottomNavigation — fades first.
 * Phase 2 (isRailVisible):   Card action rail buttons — fades 2s after Phase 1.
 *
 * Both phases reveal immediately on tap. Auto-hide triggers sequentially:
 *   5s idle → hide chrome → 2s later → hide rail.
 */

const AUTO_HIDE_CHROME_MS = 5000;
const RAIL_DELAY_AFTER_CHROME_MS = 2000;

let chromeVisible = false;
let railVisible = false;
let chromeTimer: ReturnType<typeof setTimeout> | null = null;
let railTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function clearAllTimers() {
  if (chromeTimer) { clearTimeout(chromeTimer); chromeTimer = null; }
  if (railTimer) { clearTimeout(railTimer); railTimer = null; }
}

function scheduleChromeHide() {
  if (chromeTimer) clearTimeout(chromeTimer);
  chromeTimer = setTimeout(() => {
    chromeVisible = false;
    chromeTimer = null;
    emit();
    // After chrome hides, schedule rail hide
    if (railTimer) clearTimeout(railTimer);
    railTimer = setTimeout(() => {
      railVisible = false;
      railTimer = null;
      emit();
    }, RAIL_DELAY_AFTER_CHROME_MS);
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

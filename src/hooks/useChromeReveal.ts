import { useSyncExternalStore, useCallback } from 'react';

/**
 * Chrome reveal store — controls visibility of TopBar + BottomNavigation
 * on swipe dashboards. Hidden by default; revealed by tapping the top
 * edge or bottom-center summon zones. Auto-hides after 5s of no interaction.
 */

let visible = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const AUTO_HIDE_MS = 5000;

function emit() {
  listeners.forEach((l) => l());
}

function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export function revealChrome() {
  clearTimer();
  if (!visible) {
    visible = true;
    emit();
  }
  timer = setTimeout(() => {
    visible = false;
    timer = null;
    emit();
  }, AUTO_HIDE_MS);
}

export function hideChrome() {
  clearTimer();
  if (visible) {
    visible = false;
    emit();
  }
}

export function resetChrome() {
  clearTimer();
  visible = false;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return visible;
}

export function useChromeReveal() {
  const isChromeVisible = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    isChromeVisible,
    revealChrome: useCallback(revealChrome, []),
    hideChrome: useCallback(hideChrome, []),
  };
}

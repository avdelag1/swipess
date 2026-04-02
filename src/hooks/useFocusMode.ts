import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 🧘 FOCUS MODE HOOK
 * Shows the nav bars on load, hides them after `timeout` ms of inactivity.
 * Any touch, click, or scroll instantly restores them.
 *
 * Uses capture-phase listeners so swipe-card stopPropagation() calls
 * cannot block the wake-up signal.
 */
export function useFocusMode(timeout: number = 6000) {
  const [isFocused, setIsFocused] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInteraction = useCallback(() => {
    setIsFocused(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsFocused(true), timeout);
  }, [timeout]);

  useEffect(() => {
    // Minimal set of events — avoids mousemove spam (fires 100s of times/sec)
    const events = ['touchstart', 'mousedown', 'click', 'scroll', 'pointerdown'];
    const opts = { capture: true, passive: true } as const;

    events.forEach(e => document.addEventListener(e, handleInteraction, opts));
    handleInteraction(); // start initial timer

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e => document.removeEventListener(e, handleInteraction, { capture: true }));
    };
  }, [handleInteraction]);

  return {
    isFocused: isFocused && !isManualOverride,
    setIsManualOverride,
    resetFocus: handleInteraction,
  };
}

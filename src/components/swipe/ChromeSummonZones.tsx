import { useCallback, useRef } from 'react';
import { toggleChrome } from '@/hooks/useChromeReveal';
import { triggerHaptic } from '@/utils/haptics';

/**
 * Invisible tap targets that summon the TopBar + BottomNavigation chrome
 * on swipe dashboards. One thin strip at the very top edge, one at the
 * bottom-center. They sit above the card area but never overlap the
 * swipe / zoom / photo-tap region, so gestures stay untouched.
 */
export function ChromeSummonZones() {
  // Distinguish a quick tap from a long press / drag.
  // Only a clean tap (<250ms, no movement) toggles the chrome.
  const downRef = useRef<{ t: number; x: number; y: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    downRef.current = { t: performance.now(), x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const d = downRef.current;
    downRef.current = null;
    if (!d) return;
    const dt = performance.now() - d.t;
    const dx = Math.abs(e.clientX - d.x);
    const dy = Math.abs(e.clientY - d.y);
    if (dt > 260) return; // long press → ignore
    if (dx > 8 || dy > 8) return; // drag → ignore
    e.stopPropagation();
    triggerHaptic('light');
    toggleChrome();
  }, []);

  const onPointerCancel = useCallback(() => {
    downRef.current = null;
  }, []);

  return (
    <>
      {/* Top edge strip */}
      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        data-no-pull-dismiss
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'calc(var(--safe-top, 0px) + 22px)',
          zIndex: 10010,
          background: 'transparent',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
        }}
      />
      {/* Bottom strip */}
      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        data-no-pull-dismiss
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: 0,
          left: '15%',
          right: '15%',
          height: 'calc(var(--safe-bottom, 0px) + 30px)',
          zIndex: 10010,
          background: 'transparent',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
        }}
      />
    </>
  );
}

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
  // Use click for reliable tap detection (browser already filters scrolls/long-press drags).
  // Debounce so back-to-back fires from bubbling don't cancel the toggle.
  const lastFireRef = useRef(0);
  const onTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const now = performance.now();
    if (now - lastFireRef.current < 200) return;
    lastFireRef.current = now;
    triggerHaptic('light');
    toggleChrome();
  }, []);

  return (
    <>
      {/* Top edge strip */}
      <div
        onClick={onTap}
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
        onClick={onTap}
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

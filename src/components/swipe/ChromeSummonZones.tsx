import { useCallback } from 'react';
import { revealChrome } from '@/hooks/useChromeReveal';
import { triggerHaptic } from '@/utils/haptics';

/**
 * Invisible tap targets that summon the TopBar + BottomNavigation chrome
 * on swipe dashboards. One thin strip at the very top edge, one at the
 * bottom-center. They sit above the card area but never overlap the
 * swipe / zoom / photo-tap region, so gestures stay untouched.
 */
export function ChromeSummonZones() {
  const onSummon = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    revealChrome();
  }, []);

  return (
    <>
      {/* Top edge strip */}
      <div
        onPointerDown={onSummon}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'calc(var(--safe-top, 0px) + 30px)',
          zIndex: 10010,
          background: 'transparent',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
        }}
      />
      {/* Bottom strip */}
      <div
        onPointerDown={onSummon}
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

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
  // Fire on pointerdown for instant response (no 300ms click delay on mobile),
  // but only commit on pointerup if it was a clean tap (no drag, short duration).
  // We toggle eagerly on pointerup — pointerdown only records the start state.
  const downRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const lastFireRef = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    downRef.current = { t: performance.now(), x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const d = downRef.current;
    downRef.current = null;
    if (!d) return;
    const dt = performance.now() - d.t;
    const dx = Math.abs(e.clientX - d.x);
    const dy = Math.abs(e.clientY - d.y);
    if (dt > 350) return;
    if (dx > 10 || dy > 10) return;
    const now = performance.now();
    if (now - lastFireRef.current < 180) return;
    lastFireRef.current = now;
    e.stopPropagation();
    e.preventDefault();
    triggerHaptic('light');
    toggleChrome();
  }, []);

  const onPointerCancel = useCallback(() => { downRef.current = null; }, []);

  return (
    <>
      {/* Top edge strip */}
      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'calc(var(--safe-top, 0px) + 36px)',
          zIndex: 10010,
          background: 'transparent',
          pointerEvents: 'auto',
          touchAction: 'pan-y',
        }}
      >
        {/* Breathing affordance: tap to summon header */}
        <div
          aria-hidden="true"
          className="animate-summon-glow"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 6,
            transform: 'translateX(-50%)',
            width: 44,
            height: 3,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.55)',
            boxShadow: '0 0 10px rgba(255,255,255,0.25)',
            pointerEvents: 'none',
          }}
        />
      </div>
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
          left: '8%',
          right: '8%',
          height: 'calc(var(--safe-bottom, 0px) + 44px)',
          zIndex: 10010,
          background: 'transparent',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
        }}
      >
        {/* Breathing affordance: tap to summon bottom nav */}
        <div
          aria-hidden="true"
          className="animate-summon-glow"
          style={{
            position: 'absolute',
            left: '50%',
            top: 6,
            transform: 'translateX(-50%)',
            width: 44,
            height: 3,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.55)',
            boxShadow: '0 0 10px rgba(255,255,255,0.25)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </>
  );
}

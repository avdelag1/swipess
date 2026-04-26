import { useRef, useEffect, useCallback, useState } from 'react';
import { triggerHaptic } from '@/utils/haptics';

interface FrequencyBandProps {
  /** All station frequencies as numbers (e.g. [93.1, 97.6, 101.5]) */
  stationFrequencies: number[];
  /** Current active frequency */
  currentFrequency: number;
  /** Called when user drags/snaps to a new frequency */
  onFrequencyChange: (frequency: number) => void;
  /** FM range */
  min?: number;
  max?: number;
  className?: string;
  isDark?: boolean;
}

/**
 * Horizontal touch-draggable FM frequency band.
 * The ruler scrolls behind a fixed red center indicator.
 * Snaps to nearest station on release with spring physics.
 */
export function FrequencyBand({
  stationFrequencies,
  currentFrequency,
  onFrequencyChange,
  min = 88,
  max = 108,
  className = '',
  isDark = true,
}: FrequencyBandProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);

  // pixels per MHz — governs how wide the ruler is
  const PX_PER_MHZ = 40;
  const totalWidth = (max - min) * PX_PER_MHZ;

  // Convert frequency to X offset (0 = min, totalWidth = max)
  const freqToX = (f: number) => (f - min) * PX_PER_MHZ;
  const xToFreq = (x: number) => min + x / PX_PER_MHZ;

  // State for the current band position (offset from center)
  const offsetRef = useRef(freqToX(currentFrequency));
  const [renderOffset, setRenderOffset] = useState(freqToX(currentFrequency));
  const [containerWidth, setContainerWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 390);

  useEffect(() => {
    const handleResize = () => setContainerWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Touch tracking
  const dragging = useRef(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const animFrame = useRef(0);
  const lastHapticFreq = useRef(Math.round(currentFrequency));

  // Sync when currentFrequency changes externally
  useEffect(() => {
    if (!dragging.current) {
      const target = freqToX(currentFrequency);
      offsetRef.current = target;
      setRenderOffset(target);
    }
  }, [currentFrequency]);

  const clampOffset = (x: number) => Math.max(0, Math.min(totalWidth, x));

  const snapToNearest = useCallback((offset: number) => {
    const freq = xToFreq(offset);
    // Find nearest station
    let nearest = stationFrequencies[0] || currentFrequency;
    let minDist = Math.abs(freq - nearest);
    for (const sf of stationFrequencies) {
      const d = Math.abs(freq - sf);
      if (d < minDist) { minDist = d; nearest = sf; }
    }

    // Animate spring to target
    const targetX = freqToX(nearest);
    const spring = () => {
      const dx = targetX - offsetRef.current;
      if (Math.abs(dx) < 0.5) {
        offsetRef.current = targetX;
        setRenderOffset(targetX);
        onFrequencyChange(nearest);
        return;
      }
      offsetRef.current += dx * 0.2;
      setRenderOffset(offsetRef.current);
      animFrame.current = requestAnimationFrame(spring);
    };
    cancelAnimationFrame(animFrame.current);
    animFrame.current = requestAnimationFrame(spring);
    triggerHaptic('medium');
  }, [stationFrequencies, currentFrequency, onFrequencyChange]);

  // Momentum deceleration after release
  const decelerate = useCallback(() => {
    if (Math.abs(velocity.current) < 0.3) {
      snapToNearest(offsetRef.current);
      return;
    }
    velocity.current *= 0.92;
    offsetRef.current = clampOffset(offsetRef.current + velocity.current);
    setRenderOffset(offsetRef.current);

    // Haptic tick when crossing integer frequencies
    const currentF = Math.round(xToFreq(offsetRef.current));
    if (currentF !== lastHapticFreq.current) {
      lastHapticFreq.current = currentF;
      triggerHaptic('light');
    }

    animFrame.current = requestAnimationFrame(decelerate);
  }, [snapToNearest]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onStart = (clientX: number) => {
      cancelAnimationFrame(animFrame.current);
      dragging.current = true;
      startX.current = clientX;
      startOffset.current = offsetRef.current;
      velocity.current = 0;
      lastX.current = clientX;
      lastTime.current = performance.now();
    };

    const onMove = (clientX: number) => {
      if (!dragging.current) return;
      const dx = startX.current - clientX; // inverted: drag left = freq increases
      const newOffset = clampOffset(startOffset.current + dx);
      offsetRef.current = newOffset;
      setRenderOffset(newOffset);

      // Velocity tracking
      const now = performance.now();
      const dt = now - lastTime.current;
      if (dt > 0) {
        velocity.current = (lastX.current - clientX) / dt * 16; // normalize to ~60fps
      }
      lastX.current = clientX;
      lastTime.current = now;

      // Haptic on crossing MHz boundaries
      const currentF = Math.round(xToFreq(newOffset));
      if (currentF !== lastHapticFreq.current) {
        lastHapticFreq.current = currentF;
        triggerHaptic('light');
      }
    };

    const onEnd = () => {
      if (!dragging.current) return;
      dragging.current = false;
      if (Math.abs(velocity.current) > 1) {
        decelerate();
      } else {
        snapToNearest(offsetRef.current);
      }
    };

    // Touch events
    const ts = (e: TouchEvent) => onStart(e.touches[0].clientX);
    const tm = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX); };
    const te = () => onEnd();

    // Mouse events (desktop)
    const ms = (e: MouseEvent) => { e.preventDefault(); onStart(e.clientX); };
    const mm = (e: MouseEvent) => onMove(e.clientX);
    const mu = () => onEnd();

    el.addEventListener('touchstart', ts, { passive: true });
    el.addEventListener('touchmove', tm, { passive: false });
    el.addEventListener('touchend', te, { passive: true });
    el.addEventListener('mousedown', ms);
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);

    return () => {
      cancelAnimationFrame(animFrame.current);
      el.removeEventListener('touchstart', ts);
      el.removeEventListener('touchmove', tm);
      el.removeEventListener('touchend', te);
      el.removeEventListener('mousedown', ms);
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
    };
  }, [decelerate, snapToNearest]);

  // Generate tick marks
  const ticks: { freq: number; isMajor: boolean; isStation: boolean }[] = [];
  for (let f = min; f <= max; f += 0.2) {
    const rounded = Math.round(f * 10) / 10;
    const isMajor = rounded % 2 === 0;
    const isStation = stationFrequencies.some(sf => Math.abs(sf - rounded) < 0.15);
    ticks.push({ freq: rounded, isMajor, isStation });
  }

    const bandTranslate = containerWidth / 2 - renderOffset;

  return (
    <div ref={containerRef} className={`relative overflow-hidden cursor-grab active:cursor-grabbing ${className}`} style={{ height: 80, touchAction: 'none' }}>
      {/* Fixed center indicator — red line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 z-10" style={{ background: '#FF3B30' }}>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full" style={{ background: '#FF3B30', boxShadow: '0 0 12px #FF3B30' }} />
      </div>

      {/* Scrollable band */}
      <div
        ref={bandRef}
        className="absolute top-0 h-full flex items-end"
        style={{
          width: totalWidth,
          transform: `translateX(${bandTranslate}px)`,
          willChange: 'transform',
        }}
      >
        {ticks.map((tick, i) => {
          const x = freqToX(tick.freq);
          const height = tick.isStation ? 44 : tick.isMajor ? 30 : 14;
          const width = tick.isStation ? 2.5 : tick.isMajor ? 1.5 : 0.8;
          const color = tick.isStation
            ? (isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)')
            : tick.isMajor
              ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)')
              : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');

          return (
            <div key={i} className="absolute" style={{ left: x, bottom: 12 }}>
              <div style={{ width, height, backgroundColor: color, borderRadius: 1, transform: 'translateX(-50%)' }} />
              {tick.isMajor && (
                <span
                  className="absolute text-[9px] font-medium select-none"
                  style={{
                    top: -16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tick.freq}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}



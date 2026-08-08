import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

/**
 * Compact mute control.
 * Shows once with a short discoverability fade, then stays quietly visible
 * (no infinite pulse / show-hide loop).
 */
export function EventVideoMuteButton({
  soundOn,
  onToggle,
  className,
  size = 'sm',
}: {
  soundOn: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const [hintDone, setHintDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHintDone(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setHintDone(true), 2200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Visual size compact; touch target stays ≥36px via padding on wrapper
  const box = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';
  const hit = size === 'sm' ? 'min-w-9 min-h-9 p-1.5' : 'min-w-10 min-h-10 p-1.5';
  const icon = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic('light');
        onToggle();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        'rounded-full flex items-center justify-center pointer-events-auto touch-manipulation',
        'bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-sm',
        'transition-opacity duration-500 ease-out',
        hintDone ? 'opacity-70' : 'opacity-100',
        hit,
        className,
      )}
      aria-label={soundOn ? 'Mute video audio' : 'Unmute video audio'}
    >
      <span className={cn('rounded-full flex items-center justify-center', box)}>
        {soundOn ? <Volume2 className={icon} /> : <VolumeX className={icon} />}
      </span>
    </button>
  );
}

import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

/**
 * Compact glass deck mute for phone/PWA.
 * Visual chip stays smaller than nav/action pills; outer hit area stays tappable.
 */
export function EventVideoMuteButton({
  soundOn,
  onToggle,
  className,
  size = 'xs',
  pulse,
}: {
  soundOn: boolean;
  onToggle: () => void;
  className?: string;
  /** xs = phone quick-filter / PWA; sm = mid; md = detail chrome */
  size?: 'xs' | 'sm' | 'md';
  /** Soft fade pulse — default on for xs */
  pulse?: boolean;
}) {
  // Chip = visible glass; hit = transparent padding around it for thumb taps
  const dims =
    size === 'xs'
      ? { hit: 'h-7 w-7', chip: 'h-3.5 w-3.5', icon: 'w-[7px] h-[7px]' }
      : size === 'sm'
        ? { hit: 'h-8 w-8', chip: 'h-4 w-4', icon: 'w-2 h-2' }
        : { hit: 'h-9 w-9', chip: 'h-5 w-5', icon: 'w-2.5 h-2.5' };

  const usePulse = pulse ?? size === 'xs';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic('light');
        onToggle();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation?.();
      }}
      className={cn(
        'relative z-30 flex items-center justify-center shrink-0',
        'pointer-events-auto touch-manipulation select-none',
        'bg-transparent border-0 p-0 shadow-none',
        dims.hit,
        className,
      )}
      aria-label={soundOn ? 'Mute deck audio' : 'Unmute deck audio'}
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-full text-white',
          usePulse && 'event-qf-mute',
          dims.chip,
        )}
        style={{
          background:
            'linear-gradient(145deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 100%)',
          border: '1px solid rgba(255,255,255,0.32)',
          boxShadow:
            '0 1px 4px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.4)',
          backdropFilter: 'blur(10px) saturate(160%)',
          WebkitBackdropFilter: 'blur(10px) saturate(160%)',
        }}
      >
        {soundOn ? (
          <Volume2 className={dims.icon} strokeWidth={2.75} />
        ) : (
          <VolumeX className={dims.icon} strokeWidth={2.75} />
        )}
      </span>
    </button>
  );
}

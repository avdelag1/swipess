import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { unlockMediaPlayback } from '@/utils/mediaUnlock';

/**
 * Compact glass deck mute for phone/PWA.
 * Visual chip stays smaller than nav/action pills; outer hit area stays tappable.
 * Always unlocks the iOS audio session on tap so unmuted play can succeed.
 */
export function EventVideoMuteButton({
  soundOn,
  onToggle,
  className,
  size = 'xs',
  pulse,
}: {
  soundOn: boolean;
  /** Called after media unlock — keep play()/Audio.play() inside this if possible. */
  onToggle: () => void;
  className?: string;
  /** xs = phone quick-filter / PWA; sm = mid; md = detail chrome */
  size?: 'xs' | 'sm' | 'md';
  /** Soft fade pulse — default on for xs */
  pulse?: boolean;
}) {
  // Chip = visible glass; hit = Apple-friendly tap target (≥44pt on xs+)
  const dims =
    size === 'xs'
      ? { hit: 'h-11 w-11', chip: 'h-7 w-7', icon: 'w-3.5 h-3.5' }
      : size === 'sm'
        ? { hit: 'h-11 w-11', chip: 'h-8 w-8', icon: 'w-4 h-4' }
        : { hit: 'h-12 w-12', chip: 'h-9 w-9', icon: 'w-[18px] h-[18px]' };

  const usePulse = pulse ?? size === 'xs';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic('light');
        // Unlock BEFORE state flip so unmuted play() in callers stays in-gesture
        unlockMediaPlayback();
        onToggle();
        (e.currentTarget as HTMLButtonElement).blur();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation?.();
        unlockMediaPlayback();
      }}
      className={cn(
        'chrome-icon-btn frameless-icon-hit relative z-30 flex items-center justify-center shrink-0 rounded-full',
        'pointer-events-auto touch-manipulation select-none outline-none',
        'bg-transparent border-0 p-0 shadow-none',
        dims.hit,
        className,
      )}
      aria-label={soundOn ? 'Mute deck audio' : 'Unmute / play with sound'}
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-full text-white',
          usePulse && 'event-qf-mute',
          dims.chip,
        )}
        style={{
          backdropFilter: 'blur(6px) saturate(140%)',
          WebkitBackdropFilter: 'blur(6px) saturate(140%)',
          background:
            'linear-gradient(145deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.28) 100%)',
          border: '1px solid rgba(255,255,255,0.28)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.28)',
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

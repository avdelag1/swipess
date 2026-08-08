import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

/**
 * Tiny glassmorphic mute control for the Events quick-filter card.
 * Soft pulse (fade out → fade in) so it stays discoverable without feeling heavy.
 */
export function EventVideoMuteButton({
  soundOn,
  onToggle,
  className,
  size = 'xs',
}: {
  soundOn: boolean;
  onToggle: () => void;
  className?: string;
  /** xs = phone quick-filter; sm/md slightly larger for detail screens */
  size?: 'xs' | 'sm' | 'md';
}) {
  const dims =
    size === 'xs'
      ? { hit: 'h-7 w-7', icon: 'w-2.5 h-2.5' }
      : size === 'sm'
        ? { hit: 'h-8 w-8', icon: 'w-3 h-3' }
        : { hit: 'h-9 w-9', icon: 'w-3.5 h-3.5' };

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
        'relative z-30 flex items-center justify-center rounded-full',
        'pointer-events-auto touch-manipulation select-none',
        'text-white',
        size === 'xs' && 'event-qf-mute',
        dims.hit,
        className,
      )}
      style={{
        background:
          'linear-gradient(145deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 100%)',
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow:
          '0 4px 14px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.45)',
        backdropFilter: 'blur(14px) saturate(180%)',
        WebkitBackdropFilter: 'blur(14px) saturate(180%)',
      }}
      aria-label={soundOn ? 'Mute event sound' : 'Unmute event sound'}
    >
      {soundOn ? (
        <Volume2 className={dims.icon} strokeWidth={2.4} />
      ) : (
        <VolumeX className={dims.icon} strokeWidth={2.4} />
      )}
    </button>
  );
}

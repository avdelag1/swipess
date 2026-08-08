import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

/**
 * Tiny mute/unmute control that slowly fades out, then reappears,
 * so users notice they can toggle event video audio.
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
  const [pulseKey, setPulseKey] = useState(0);

  // Restart the fade cycle after user taps so the hint stays discoverable
  useEffect(() => {
    setPulseKey((k) => k + 1);
  }, [soundOn]);

  const box = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const icon = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      key={pulseKey}
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic('light');
        onToggle();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        'rounded-full bg-black/45 backdrop-blur-md border border-white/25 text-white shadow-md flex items-center justify-center pointer-events-auto',
        'animate-event-mute-hint',
        box,
        className,
      )}
      aria-label={soundOn ? 'Mute video audio' : 'Unmute video audio'}
    >
      {soundOn ? <Volume2 className={icon} /> : <VolumeX className={icon} />}
      <style>{`
        @keyframes event-mute-hint {
          0%, 12% { opacity: 1; transform: scale(1); }
          45%, 55% { opacity: 0.18; transform: scale(0.96); }
          88%, 100% { opacity: 1; transform: scale(1); }
        }
        .animate-event-mute-hint {
          animation: event-mute-hint 4.8s ease-in-out infinite;
        }
      `}</style>
    </button>
  );
}

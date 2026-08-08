import { memo, useCallback, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EventCategoryCircleProps {
  label: string;
  img: string;
  icon: LucideIcon;
  active: boolean;
  isLight: boolean;
  onClick: () => void;
  /** Eager-decode the first rings visible in the strip. */
  priority?: boolean;
}

/** Compact topic chip — refined, not visually dominant. */
export const EventCategoryCircle = memo(({
  label,
  img,
  icon: Icon,
  active,
  isLight,
  onClick,
  priority = false,
}: EventCategoryCircleProps) => {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    setReady(false);
    setFailed(false);
  }, [img]);

  const handleLoad = useCallback(() => setReady(true), []);
  const handleError = useCallback(() => {
    setFailed(true);
    setReady(true);
  }, []);

  return (
    <button
      type="button"
      data-no-cinematic
      data-skip-press-engine
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      className="flex flex-col items-center gap-1 shrink-0 press-snappy group focus:outline-none focus-visible:outline-none outline-none tap-highlight-transparent"
      aria-label={label}
      aria-pressed={active}
    >
      <div
        className={cn(
          'w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[1.5px] transition-all duration-300',
          active
            ? 'bg-gradient-to-tr from-[#FF4D00] to-[#EB4898] shadow-md shadow-[#EB4898]/20'
            : (isLight ? 'bg-black/8' : 'bg-white/15'),
        )}
      >
        <div
          className={cn(
            'w-full h-full rounded-full border-[1.5px] overflow-hidden relative',
            isLight ? 'border-white/90 bg-slate-100' : 'border-[#0a0a0b] bg-[#1a1a1b]',
          )}
        >
          {!failed && (
            <img
              src={img}
              alt={label}
              width={36}
              height={36}
              decoding="async"
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                'w-full h-full object-cover transition-all duration-300',
                ready ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
                !active && 'group-hover:scale-105',
              )}
            />
          )}

          {(!ready || failed) && (
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center transition-opacity duration-200',
                failed || !ready ? 'opacity-100' : 'opacity-0',
              )}
              style={{
                background: failed
                  ? 'linear-gradient(135deg, rgba(255,77,0,0.35), rgba(235,72,152,0.35))'
                  : 'rgba(255,255,255,0.06)',
              }}
            >
              <Icon className={cn('w-3.5 h-3.5', isLight ? 'text-slate-500' : 'text-white/70')} />
            </div>
          )}

          {!active && ready && !failed && (
            <div
              className={cn(
                'absolute inset-0 transition-colors pointer-events-none',
                isLight ? 'bg-white/35' : 'bg-black/45',
              )}
            />
          )}
        </div>
      </div>
      <span
        className={cn(
          'text-[9px] font-semibold tracking-wide w-[52px] text-center truncate leading-tight',
          active ? (isLight ? 'text-black' : 'text-white') : (isLight ? 'text-black/55' : 'text-white/55'),
        )}
      >
        {label}
      </span>
    </button>
  );
});

EventCategoryCircle.displayName = 'EventCategoryCircle';

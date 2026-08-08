import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

interface AmbientPageBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Subtle tonal depth vs flat canvas */
  variant?: 'default' | 'subtle';
  /**
   * `fill` — stretch inside flex / absolute parents (dashboard, swipe deck).
   * `page` — scrollable pages that declare their own min-height.
   */
  layout?: 'page' | 'fill';
}

/**
 * Tonal depth backdrop — NO sunset / colorful animated orbs.
 * Creates layered dark/light surfaces for Liquid Glass controls to float on.
 */
function AmbientBackdrop({
  tone,
  variant = 'default',
  className,
}: {
  tone: 'light' | 'dark';
  variant?: 'default' | 'subtle';
  className?: string;
}) {
  const isLight = tone === 'light';
  return (
    <div
      aria-hidden
      className={cn(
        'ambient-page-bg pointer-events-none absolute inset-0 -z-10 overflow-hidden',
        variant === 'subtle' && 'opacity-90',
        className,
      )}
      style={{
        background: isLight
          ? 'var(--dash-bg, #F2F2F7)'
          : 'var(--dash-bg, #0a0a0d)',
      }}
    >
      {/* Soft tonal wells — monochrome only */}
      <div
        className="absolute inset-x-0 top-0 h-[42%]"
        style={{
          background: isLight
            ? 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0) 100%)',
        }}
      />
      <div
        className="absolute -bottom-[12%] left-1/2 -translate-x-1/2 w-[120%] h-[55%] rounded-[50%]"
        style={{
          background: isLight
            ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.04) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 68%)',
        }}
      />
    </div>
  );
}

export function AmbientPageBackground({
  children,
  className,
  style,
  variant = 'default',
  layout = 'page',
  ...rest
}: AmbientPageBackgroundProps) {
  const { isLight } = useAppTheme();
  const isFill = layout === 'fill';

  return (
    <div
      className={cn(
        'relative w-full',
        isFill && 'flex flex-col flex-1 min-h-0 h-full',
        className,
      )}
      style={style}
      {...rest}
    >
      <AmbientBackdrop tone={isLight ? 'light' : 'dark'} variant={variant} />
      <div
        className={cn(
          'relative z-0 w-full',
          isFill && 'flex flex-col flex-1 min-h-0 h-full',
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Dark immersive shell for public previews, landing, and access gate. */
export function ImmersiveDarkShell({
  children,
  className,
  style,
  variant = 'subtle',
}: AmbientPageBackgroundProps) {
  return (
    <div
      className={cn('relative w-full h-full min-h-0 flex flex-col', className)}
      style={style}
    >
      <AmbientBackdrop tone="dark" variant={variant} />
      <div className="relative z-0 w-full h-full min-h-0 flex flex-col flex-1">
        {children}
      </div>
    </div>
  );
}

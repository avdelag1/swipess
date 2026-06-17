import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

interface AmbientPageBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Show subtle brand gradient orbs behind content */
  variant?: 'default' | 'subtle';
  /**
   * `fill` — stretch inside flex / absolute parents (dashboard, swipe deck).
   * `page` — scrollable pages that declare their own min-height.
   */
  layout?: 'page' | 'fill';
}

function AmbientBackdrop({
  tone,
  variant = 'default',
  className,
}: {
  tone: 'light' | 'dark';
  variant?: 'default' | 'subtle';
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'ambient-page-bg pointer-events-none absolute inset-0 -z-10',
        tone === 'light' ? 'ambient-page-bg--light' : 'ambient-page-bg--dark',
        variant === 'subtle' && 'opacity-80',
        className,
      )}
    />
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
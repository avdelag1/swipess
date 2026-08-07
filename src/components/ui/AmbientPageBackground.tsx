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
  tone: _tone,
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
        'ambient-page-bg pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-background',
        variant === 'subtle' && 'opacity-80',
        className,
      )}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-40 mix-blend-screen blur-[80px] animate-orb-1" 
           style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.8) 0%, rgba(255,200,0,0) 70%)' }} />
      <div className="absolute top-[20%] right-[-20%] w-[70%] h-[70%] rounded-full opacity-30 mix-blend-screen blur-[100px] animate-orb-2" 
           style={{ background: 'radial-gradient(circle, rgba(138,43,226,0.6) 0%, rgba(255,0,128,0) 70%)' }} />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full opacity-50 mix-blend-screen blur-[90px] animate-orb-3" 
           style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,165,0,0) 70%)' }} />
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
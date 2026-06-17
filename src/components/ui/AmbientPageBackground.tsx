import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

interface AmbientPageBackgroundProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Show subtle brand gradient orbs behind content */
  variant?: 'default' | 'subtle';
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
}: AmbientPageBackgroundProps) {
  const { isLight } = useAppTheme();

  return (
    <div className={cn('relative min-h-full w-full', className)} style={style}>
      <AmbientBackdrop tone={isLight ? 'light' : 'dark'} variant={variant} />
      <div className="relative z-0">{children}</div>
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
    <div className={cn('relative min-h-full w-full', className)} style={style}>
      <AmbientBackdrop tone="dark" variant={variant} />
      <div className="relative z-0">{children}</div>
    </div>
  );
}
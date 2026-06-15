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

export function AmbientPageBackground({
  children,
  className,
  style,
  variant = 'default',
}: AmbientPageBackgroundProps) {
  const { isLight } = useAppTheme();

  return (
    <div className={cn('relative min-h-full w-full', className)} style={style}>
      <div
        aria-hidden
        className={cn(
          'ambient-page-bg pointer-events-none absolute inset-0 -z-10',
          isLight ? 'ambient-page-bg--light' : 'ambient-page-bg--dark',
          variant === 'subtle' && 'opacity-80',
        )}
      />
      <div className="relative z-0">{children}</div>
    </div>
  );
}
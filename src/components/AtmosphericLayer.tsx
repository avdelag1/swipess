import { memo } from 'react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

interface AtmosphericLayerProps {
  variant?: 'default' | 'primary' | 'indigo' | 'rose' | 'Swipes';
  opacity?: number;
  speed?: number;
}

/**
 * Soft ambient page depth — uses the same gradient system as AmbientPageBackground.
 * Variant prop kept for API compatibility; all variants share one cohesive look.
 */
export const AtmosphericLayer = memo(({ opacity = 1 }: AtmosphericLayerProps) => {
  const { isLight } = useAppTheme();

  return (
    <div
      aria-hidden
      className={cn(
        'ambient-page-bg pointer-events-none absolute inset-0 z-0',
        isLight ? 'ambient-page-bg--light' : 'ambient-page-bg--dark',
      )}
      style={{ opacity: opacity < 0.15 ? 0.85 : opacity }}
    />
  );
});

AtmosphericLayer.displayName = 'AtmosphericLayer';
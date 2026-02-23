import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessSWatermarkProps {
  className?: string;
  /** Opacity of the watermark (0-1). Default 0.05 for subtle branding */
  opacity?: number;
  /** Size in pixels or CSS value */
  size?: number | string;
}

/**
 * SWIPESS S WATERMARK
 *
 * Uses the actual s-logo-app.png (the fire-S icon) as a watermark.
 * Guaranteed visual consistency with the app icon/branding.
 *
 * Designed for:
 * - Background watermark on landing page
 * - Subtle branding element across app sections
 * - Visual identity marker that users recognize as "Swipess"
 */
function SwipessSWatermarkComponent({
  className,
  opacity = 0.05,
  size = 400,
}: SwipessSWatermarkProps) {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <img
      src="/icons/s-logo-app.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn('pointer-events-none select-none', className)}
      style={{
        width: sizeValue,
        height: sizeValue,
        opacity,
        objectFit: 'contain',
      }}
    />
  );
}

export const SwipessSWatermark = memo(SwipessSWatermarkComponent);

/**
 * SWIPESS S PATTERN
 *
 * Scattered fire-S marks across a section for branded background texture.
 * Each S is positioned at different locations with varied rotation and scale
 * to create an organic, non-repeating pattern.
 */
interface SwipessSPatternProps {
  className?: string;
  /** Opacity for each S instance. Default 0.03 */
  opacity?: number;
  /** Number of S marks to render (max 7) */
  count?: number;
}

const PATTERN_POSITIONS = [
  { top: '5%', right: '-2%', rotate: 15, scale: 1.1 },
  { bottom: '8%', left: '-4%', rotate: -20, scale: 0.9 },
  { top: '45%', right: '3%', rotate: 10, scale: 0.65 },
  { top: '12%', left: '5%', rotate: -12, scale: 0.5 },
  { bottom: '30%', right: '8%', rotate: 22, scale: 0.55 },
  { top: '65%', left: '-2%', rotate: -15, scale: 0.75 },
  { bottom: '5%', right: '25%', rotate: 8, scale: 0.4 },
] as const;

function SwipessSPatternComponent({
  className,
  opacity = 0.03,
  count = 5,
}: SwipessSPatternProps) {
  return (
    <div
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      aria-hidden="true"
    >
      {PATTERN_POSITIONS.slice(0, Math.min(count, 7)).map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: 'top' in pos ? pos.top : undefined,
            bottom: 'bottom' in pos ? pos.bottom : undefined,
            left: 'left' in pos ? pos.left : undefined,
            right: 'right' in pos ? pos.right : undefined,
            transform: `rotate(${pos.rotate}deg) scale(${pos.scale})`,
          }}
        >
          <SwipessSWatermark opacity={opacity} size={280} />
        </div>
      ))}
    </div>
  );
}

export const SwipessSPattern = memo(SwipessSPatternComponent);

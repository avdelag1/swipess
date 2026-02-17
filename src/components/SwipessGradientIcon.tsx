import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipessGradientIconProps {
  /** Icon size in px. Default: 32 */
  size?: number;
  className?: string;
  /** Show the black rounded-rectangle background (like the app icon). Default: true */
  withBackground?: boolean;
  /** Corner radius when withBackground is true (0–0.5 of size). Default: 0.22 */
  backgroundRadius?: number;
}

/**
 * SWIPESS GRADIENT S ICON
 *
 * Inline SVG of the Swipess brand S icon with pink→orange gradient.
 * Matches the gradient S logo the user uploaded (same design used for PWA/app icons).
 *
 * Use this instead of <img src="/icons/s-icon-gradient.svg"> when you need:
 * - Perfect sharpness at any size (true vector, no rasterization)
 * - Consistent rendering without network requests
 * - Gradient colors that integrate with CSS variables if needed
 *
 * Examples:
 *   <SwipessGradientIcon size={24} />               // small topbar icon
 *   <SwipessGradientIcon size={48} />               // section header
 *   <SwipessGradientIcon size={120} withBackground />  // splash / empty state
 */
function SwipessGradientIconComponent({
  size = 32,
  className,
  withBackground = true,
  backgroundRadius = 0.22,
}: SwipessGradientIconProps) {
  const rx = Math.round(size * backgroundRadius);

  return (
    <svg
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={cn('flex-shrink-0 select-none', className)}
      aria-label="Swipess"
      role="img"
    >
      <defs>
        <linearGradient id={`sg-grad-${size}`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%"   stopColor="#FF3CAC" />
          <stop offset="35%"  stopColor="#F05A28" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>

      {/* Black rounded background */}
      {withBackground && (
        <rect width="1024" height="1024" rx={rx * (1024 / size)} fill="#000000" />
      )}

      {/* Fire-S with pink → orange gradient */}
      <path
        d="M608 175
           C586 158 550 142 518 136
           C486 130 458 128 436 128
           Q338 128 274 180
           Q210 232 210 316
           Q210 388 252 440
           Q294 492 382 534
           L510 588
           Q604 626 652 682
           Q700 738 700 812
           Q700 894 642 944
           Q584 994 502 994
           Q428 994 370 958
           Q312 922 284 866
           L192 904
           Q226 972 296 1012
           Q366 1052 452 1052
           Q454 1052 502 1052
           Q612 1048 686 994
           Q760 940 780 862
           Q798 784 786 712
           Q774 652 724 606
           Q674 560 622 538
           L494 484
           Q406 450 368 412
           Q330 374 330 324
           Q330 266 376 230
           Q422 194 484 194
           Q534 194 576 220
           Q602 236 622 258
           C638 230 660 196 680 172
           C700 148 722 130 740 122
           C758 114 772 118 772 134
           C772 150 756 172 734 196
           C712 220 680 242 654 260
           L622 258
           L608 175
           Z
           M656 260
           C682 220 714 176 738 150
           C756 132 770 130 776 138
           C782 146 776 162 762 182
           C742 210 712 238 684 258
           C668 268 658 266 656 260
           Z"
        fill={`url(#sg-grad-${size})`}
        fillRule="evenodd"
      />
    </svg>
  );
}

export const SwipessGradientIcon = memo(SwipessGradientIconComponent);

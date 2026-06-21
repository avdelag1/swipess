import { cn } from '@/lib/utils';

import type { MotionIconId } from '@/lib/motion-constants';

interface MotionIconProps {
  id: MotionIconId;
  /** Brief burst on press */
  active?: boolean;
  /** Continuous animation (AI processing, active nav tab) */
  loop?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function MotionIcon({
  id,
  active = false,
  loop = false,
  className,
  style,
  children,
}: MotionIconProps) {
  return (
    <span
      className={cn(
        'motion-icon',
        `motion-icon--${id}`,
        active && 'motion-icon--active',
        loop && 'motion-icon--loop',
        className,
      )}
      style={style}
      aria-hidden
    >
      {children}
    </span>
  );
}
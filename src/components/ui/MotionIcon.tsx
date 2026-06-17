import { cn } from '@/lib/utils';

/** CSS micro-animations replacing the old Lottie JSON icons. */
export type MotionIconId =
  | 'heart'
  | 'dislike'
  | 'messages'
  | 'browse'
  | 'compass'
  | 'filter'
  | 'ai-sparkle'
  | 'eventos'
  | 'likes'
  | 'profile'
  | 'pop'
  | 'map'
  | 'send';

const NAV_MOTION_MAP: Record<string, MotionIconId> = {
  dashboard: 'browse',
  likes: 'likes',
  ai: 'ai-sparkle',
  messages: 'messages',
  events: 'eventos',
  search: 'filter',
  add: 'pop',
  vapid: 'profile',
  radio: 'pop',
  legal: 'compass',
};

export function getNavMotionId(navId: string): MotionIconId | undefined {
  return NAV_MOTION_MAP[navId];
}

export function swipeVariantToMotion(variant: string): MotionIconId | undefined {
  if (variant === 'like') return 'heart';
  if (variant === 'dislike') return 'dislike';
  if (variant === 'blue') return 'messages';
  if (variant === 'cyan') return 'browse';
  if (variant === 'amber') return 'filter';
  return undefined;
}

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
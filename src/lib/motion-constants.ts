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
  | 'send'
  | 'radio'
  | 'scale';

const NAV_MOTION_MAP: Record<string, MotionIconId> = {
  dashboard: 'browse',
  likes: 'likes',
  ai: 'ai-sparkle',
  messages: 'messages',
  events: 'eventos',
  search: 'filter',
  add: 'pop',
  vapid: 'profile',
  radio: 'radio',
  legal: 'scale',
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

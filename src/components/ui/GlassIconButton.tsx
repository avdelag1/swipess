import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

type GlassIconSize = 'sm' | 'md' | 'lg' | 'hero';
type GlassIconTone = 'surface' | 'onPhoto';

/** Icon glyph size (px) per tier. */
const ICON_PX: Record<GlassIconSize, number> = { sm: 16, md: 18, lg: 20, hero: 36 };
/** Tap-target size per tier (kept generous for accessibility). */
const TAP_TARGET: Record<GlassIconSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-10 h-10',
  hero: 'w-14 h-14',
};

export interface GlassIconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  icon: LucideIcon;
  /** Accessible label (also used as aria-label). */
  label: string;
  size?: GlassIconSize;
  /**
   * 'surface' (default): theme-aware — foreground colour (white in dark themes,
   *   dark in light themes). For chrome over the app surface (header, nav, dialogs).
   * 'onPhoto': always white + drop-shadow. For controls floating over photos/media
   *   so they stay legible in every theme — like YouTube's controls over video.
   */
  tone?: GlassIconTone;
  strokeWidth?: number;
  /** Explicit icon colour override (e.g. amber for an active undo state). */
  iconColor?: string;
  iconClassName?: string;
  /** Fire a light haptic on press (default true). */
  haptic?: boolean;
  /**
   * For buttons rendered INSIDE a draggable swipe card: prevents the pointer/click
   * from bubbling to the card's drag/swipe handler and marks the button so the
   * pull-to-dismiss and cinematic-tap systems ignore it.
   */
  guardSwipe?: boolean;
}

/**
 * Unified frosted-glass HUD icon button.
 *
 * Frameless by default — the icon floats on whatever glass frame contains it
 * (e.g. the swipe-card action rail or a header glass-pill), matching the
 * YouTube-style control look. For a standalone framed button, pass `style`
 * (inline styles win over the base class) and/or `className`.
 *
 * Replaces the previously-duplicated `ActionRailButton` defined in both
 * SimpleSwipeCard and SimpleOwnerSwipeCard.
 */
export const GlassIconButton = forwardRef<HTMLButtonElement, GlassIconButtonProps>(
  function GlassIconButton(
    {
      icon: Icon,
      label,
      size = 'md',
      tone = 'surface',
      strokeWidth = 1.8,
      iconColor,
      iconClassName,
      haptic = true,
      guardSwipe = false,
      className,
      onClick,
      onPointerDown,
      ...rest
    },
    ref,
  ) {
    const px = ICON_PX[size];

    const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (e) => {
      if (guardSwipe) {
        e.preventDefault();
        e.stopPropagation();
      }
      onPointerDown?.(e);
    };

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      if (guardSwipe) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (haptic) triggerHaptic('light');
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        data-tone={tone === 'onPhoto' ? 'photo' : undefined}
        data-no-pull-dismiss={guardSwipe ? '' : undefined}
        data-no-cinematic={guardSwipe ? '' : undefined}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        className={cn(
          'glass-icon-btn rounded-full outline-none',
          TAP_TARGET[size],
          className,
        )}
        {...rest}
      >
        <Icon
          size={px}
          color={iconColor}
          strokeWidth={strokeWidth}
          className={iconClassName}
          aria-hidden="true"
        />
      </button>
    );
  },
);

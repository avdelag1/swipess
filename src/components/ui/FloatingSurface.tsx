import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

type Elevation = 'surface' | 'elevated' | 'floating' | 'modal';

interface FloatingSurfaceProps {
  children: ReactNode;
  className?: string;
  elevation?: Elevation;
  /** pill = fully rounded chip; card = large radius slab */
  shape?: 'card' | 'pill';
  interactive?: boolean;
  as?: 'div' | 'button' | 'section';
  onClick?: () => void;
}

const elevationClass: Record<Elevation, string> = {
  surface: 'shadow-[var(--elevation-surface)]',
  elevated: 'shadow-[var(--elevation-elevated)]',
  floating: 'shadow-[var(--elevation-floating)]',
  modal: 'shadow-[var(--elevation-modal)]',
};

export function FloatingSurface({
  children,
  className,
  elevation = 'floating',
  shape = 'card',
  interactive = false,
  as: Tag = 'div',
  onClick,
}: FloatingSurfaceProps) {
  const { isLight } = useAppTheme();

  return (
    <Tag
      onClick={onClick}
      className={cn(
        'relative overflow-hidden isolation-isolate',
        shape === 'pill' ? 'rounded-full glass-pill' : 'rounded-[2rem] glass-surface',
        isLight && 'glass-light-surface',
        !isLight && 'glass-dark',
        elevationClass[elevation],
        interactive && 'transition-transform duration-150 active:scale-[0.98] cursor-pointer',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
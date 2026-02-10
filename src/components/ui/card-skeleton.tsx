import { memo } from 'react';
import { cn } from '@/lib/utils';

interface CardSkeletonProps {
  className?: string;
  variant?: 'default' | 'property' | 'profile' | 'compact';
  style?: React.CSSProperties;
}

/**
 * CardSkeleton - Shimmer loading state for cards
 *
 * Variants:
 * - default: Standard card with image and text
 * - property: Property listing card with badges
 * - profile: User profile card with avatar
 * - compact: Smaller card for lists
 */
export const CardSkeleton = memo(function CardSkeleton({
  className,
  variant = 'default',
  style
}: CardSkeletonProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('bg-card rounded-xl p-4 border border-border', className)} style={style}>
        <div className="flex items-center gap-3">
          <div className="skeleton skeleton-avatar w-10 h-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton skeleton-text w-3/4 h-4" />
            <div className="skeleton skeleton-text w-1/2 h-3" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div className={cn('bg-card rounded-2xl overflow-hidden border border-border', className)} style={style}>
        {/* Avatar area */}
        <div className="skeleton h-48 w-full" />
        <div className="p-4 space-y-3">
          {/* Name */}
          <div className="skeleton skeleton-text w-2/3 h-6" />
          {/* Bio */}
          <div className="space-y-2">
            <div className="skeleton skeleton-text w-full h-4" />
            <div className="skeleton skeleton-text w-4/5 h-4" />
          </div>
          {/* Tags */}
          <div className="flex gap-2 pt-2">
            <div className="skeleton w-16 h-6 rounded-full" />
            <div className="skeleton w-20 h-6 rounded-full" />
            <div className="skeleton w-14 h-6 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'property') {
    return (
      <div className={cn('bg-card rounded-2xl overflow-hidden border border-border', className)} style={style}>
        {/* Image */}
        <div className="skeleton skeleton-image aspect-[4/3]" />
        <div className="p-4 space-y-3">
          {/* Price badge */}
          <div className="flex justify-between items-center">
            <div className="skeleton w-24 h-7 rounded-lg" />
            <div className="skeleton w-16 h-5 rounded" />
          </div>
          {/* Title */}
          <div className="skeleton skeleton-text w-3/4 h-5" />
          {/* Location */}
          <div className="flex items-center gap-2">
            <div className="skeleton w-4 h-4 rounded" />
            <div className="skeleton skeleton-text w-1/2 h-4" />
          </div>
          {/* Features */}
          <div className="flex gap-4 pt-2">
            <div className="skeleton w-12 h-4" />
            <div className="skeleton w-12 h-4" />
            <div className="skeleton w-16 h-4" />
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('bg-card rounded-xl overflow-hidden border border-border', className)} style={style}>
      <div className="skeleton skeleton-image aspect-video" />
      <div className="p-4 space-y-3">
        <div className="skeleton skeleton-text w-3/4 h-5" />
        <div className="skeleton skeleton-text w-full h-4" />
        <div className="skeleton skeleton-text w-2/3 h-4" />
      </div>
    </div>
  );
});

/**
 * SwipeCardSkeleton - Full-height swipe card skeleton
 */
export const SwipeCardSkeleton = memo(function SwipeCardSkeleton({
  className
}: { className?: string }) {
  return (
    <div className={cn(
      'relative w-full h-full rounded-3xl overflow-hidden bg-card border border-border',
      className
    )}>
      {/* Image skeleton */}
      <div className="skeleton absolute inset-0" />

      {/* Content overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="space-y-3">
          {/* Title */}
          <div className="skeleton w-2/3 h-7 bg-white/20 rounded" />
          {/* Subtitle */}
          <div className="skeleton w-1/2 h-5 bg-white/20 rounded" />
          {/* Tags */}
          <div className="flex gap-2 pt-2">
            <div className="skeleton w-16 h-6 bg-white/20 rounded-full" />
            <div className="skeleton w-20 h-6 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * ListSkeleton - Multiple skeleton items for lists
 */
export const ListSkeleton = memo(function ListSkeleton({
  count = 3,
  variant = 'default',
  className
}: {
  count?: number;
  variant?: CardSkeletonProps['variant'];
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton
          key={i}
          variant={variant}
          className="stagger-item"
          style={{ animationDelay: `${i * 0.1}s` } as React.CSSProperties}
        />
      ))}
    </div>
  );
});

export default CardSkeleton;

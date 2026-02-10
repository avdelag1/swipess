/**
 * Rating Display Components
 *
 * Displays ratings on swipe cards with:
 * - Displayed rating (confidence-weighted)
 * - Rating count
 * - Trust level badge
 * - Sample positive/negative review titles
 */

import { memo } from 'react';
import { Star, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RatingAggregate } from '@/hooks/useRatingSystem';

// ============================================================================
// TRUST LEVEL BADGE
// ============================================================================

interface TrustBadgeProps {
  trustLevel: 'new' | 'trusted' | 'needs_attention';
  className?: string;
}

export const TrustBadge = memo<TrustBadgeProps>(({ trustLevel, className }) => {
  const config = {
    new: {
      label: 'New',
      icon: Sparkles,
      variant: 'secondary' as const,
      className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
    },
    trusted: {
      label: 'Trusted',
      icon: ShieldCheck,
      variant: 'default' as const,
      className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
    },
    needs_attention: {
      label: 'Needs Attention',
      icon: AlertTriangle,
      variant: 'destructive' as const,
      className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300',
    },
  };

  const { label, icon: Icon, className: badgeClassName } = config[trustLevel];

  return (
    <Badge variant="outline" className={cn(badgeClassName, 'gap-1 font-medium', className)}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
});

TrustBadge.displayName = 'TrustBadge';

// ============================================================================
// COMPACT RATING DISPLAY (For Swipe Cards)
// ============================================================================

interface CompactRatingDisplayProps {
  aggregate: RatingAggregate | null;
  className?: string;
  showReviews?: boolean;
}

// Skeleton loader for rating display
const RatingSkeleton = memo(() => (
  <div className="flex items-center gap-2 text-sm animate-pulse">
    <div className="flex items-center gap-1">
      <div className="w-4 h-4 bg-muted rounded" />
      <div className="w-8 h-4 bg-muted rounded" />
    </div>
    <div className="w-12 h-5 bg-muted rounded-full" />
  </div>
));

RatingSkeleton.displayName = 'RatingSkeleton';

interface CompactRatingDisplayPropsWithLoading extends CompactRatingDisplayProps {
  isLoading?: boolean;
}

export const CompactRatingDisplay = memo<CompactRatingDisplayPropsWithLoading>(
  ({ aggregate, className, showReviews = true, isLoading = false }) => {
    if (isLoading) {
      return <RatingSkeleton />;
    }

    if (!aggregate) {
      // No ratings yet - show default 5.0 (no "New" badge)
      return (
        <div className={cn('flex items-center gap-1 text-sm', className)}>
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold">5.0</span>
        </div>
      );
    }

    const { displayed_rating, total_ratings, trust_level, best_review, worst_review } = aggregate;

    return (
      <div className={cn('space-y-2', className)}>
        {/* Rating and Trust Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-base">
              {displayed_rating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({total_ratings})
            </span>
          </div>
          {trust_level !== 'new' && <TrustBadge trustLevel={trust_level} />}
        </div>

        {/* Sample Reviews (if available and showReviews is true) */}
        {showReviews && (best_review || worst_review) && (
          <div className="space-y-1 text-xs">
            {best_review?.review_title && (
              <div className="flex items-start gap-1 text-green-700 dark:text-green-300">
                <span className="font-medium">+</span>
                <p className="line-clamp-1 italic">"{best_review.review_title}"</p>
              </div>
            )}
            {worst_review?.review_title && (
              <div className="flex items-start gap-1 text-orange-700 dark:text-orange-300">
                <span className="font-medium">−</span>
                <p className="line-clamp-1 italic">"{worst_review.review_title}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

CompactRatingDisplay.displayName = 'CompactRatingDisplay';

// ============================================================================
// DETAILED RATING DISPLAY (For Listing Details)
// ============================================================================

interface DetailedRatingDisplayProps {
  aggregate: RatingAggregate | null;
  className?: string;
}

export const DetailedRatingDisplay = memo<DetailedRatingDisplayProps>(
  ({ aggregate, className }) => {
    if (!aggregate || aggregate.total_ratings === 0) {
      return (
        <div className={cn('text-center py-8', className)}>
          <Star className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-lg font-medium">No ratings yet</p>
          <p className="text-sm text-muted-foreground">Be the first to review!</p>
        </div>
      );
    }

    const {
      displayed_rating,
      total_ratings,
      verified_ratings,
      trust_level,
      rating_distribution,
    } = aggregate;

    const maxCount = Math.max(...Object.values(rating_distribution));

    return (
      <div className={cn('space-y-6', className)}>
        {/* Overall Rating */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-5xl font-bold">{displayed_rating.toFixed(1)}</span>
            <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
          </div>
          <p className="text-sm text-muted-foreground">
            {total_ratings} {total_ratings === 1 ? 'rating' : 'ratings'}
            {verified_ratings > 0 && ` (${verified_ratings} verified)`}
          </p>
          <div className="mt-2 flex justify-center">
            <TrustBadge trustLevel={trust_level} />
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = rating_distribution[stars.toString()] || 0;
            const percentage = total_ratings > 0 ? (count / total_ratings) * 100 : 0;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={stars} className="flex items-center gap-2 text-sm">
                <span className="w-12 text-right font-medium">{stars} ★</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="w-12 text-muted-foreground">
                  {percentage > 0 ? `${percentage.toFixed(0)}%` : '0%'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

DetailedRatingDisplay.displayName = 'DetailedRatingDisplay';

// ============================================================================
// STAR RATING INPUT (For Rating Submission)
// ============================================================================

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const StarRatingInput = memo<StarRatingInputProps>(
  ({ value, onChange, max = 5, size = 'md', disabled = false, className }) => {
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10',
    };

    return (
      <div className={cn('flex items-center gap-1', className)}>
        {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
          const isFilled = star <= value;

          return (
            <button
              key={star}
              type="button"
              onClick={() => !disabled && onChange(star)}
              disabled={disabled}
              className={cn(
                'transition-all',
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110',
                'focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded'
              )}
              aria-label={`Rate ${star} stars`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-none text-gray-300 dark:text-gray-600'
                )}
              />
            </button>
          );
        })}
        {value > 0 && (
          <span className="ml-2 text-sm font-medium text-muted-foreground">
            {value} / {max}
          </span>
        )}
      </div>
    );
  }
);

StarRatingInput.displayName = 'StarRatingInput';

/**
 * @deprecated This component is DEPRECATED and uses the old review system.
 * Use @/components/RatingDisplay.tsx components instead.
 *
 * This file is kept for reference only and will not function with the current database schema.
 */

import { Star, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Review } from '@/hooks/useReviews';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getReviewTypeLabel = (type: string) => {
    switch (type) {
      case 'property':
        return 'Property Review';
      case 'user_as_tenant':
        return 'Tenant Review';
      case 'user_as_owner':
        return 'Owner Review';
      default:
        return 'Review';
    }
  };

  const getReviewTypeColor = (type: string) => {
    switch (type) {
      case 'property':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'user_as_tenant':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'user_as_owner':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {review.reviewer_profile?.avatar_url ? (
                <img
                  src={review.reviewer_profile.avatar_url}
                  alt={review.reviewer_profile.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">
                {review.reviewer_profile?.full_name || 'Anonymous User'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(review.created_at)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getReviewTypeColor(review.review_type)}>
              {getReviewTypeLabel(review.review_type)}
            </Badge>
            {review.is_verified && (
              <Badge variant="secondary" className="text-xs">
                Verified
              </Badge>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= review.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-foreground">
            {review.rating}.0
          </span>
        </div>

        {/* Review Text */}
        {review.review_text && (
          <div className="space-y-2">
            <p className="text-sm text-foreground leading-relaxed">
              {review.review_text}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
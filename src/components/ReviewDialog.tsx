/**
 * @deprecated This component is DEPRECATED and uses the old review system.
 * Use @/components/RatingSubmissionDialog.tsx instead.
 *
 * This file is kept for reference only and will not function with the current database schema.
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useCreateReview, CreateReviewData } from '@/hooks/useReviews';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: 'user' | 'property';
  targetId: string;
  targetName: string;
  reviewType: 'property' | 'user_as_tenant' | 'user_as_owner';
}

export function ReviewDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetName,
  reviewType,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const createReview = useCreateReview();

  const handleSubmit = async () => {
    if (rating === 0) {
      return;
    }

    const reviewData: CreateReviewData = {
      rating,
      review_text: reviewText.trim() || undefined,
      review_type: reviewType,
    };

    if (targetType === 'user') {
      reviewData.reviewed_user_id = targetId;
    } else {
      reviewData.listing_id = targetId;
    }

    try {
      await createReview.mutateAsync(reviewData);
      onOpenChange(false);
      setRating(0);
      setReviewText('');
    } catch (error) {
      // Error handled by the hook
    }
  };

  const getReviewTypeTitle = () => {
    switch (reviewType) {
      case 'property':
        return `Review Property: ${targetName}`;
      case 'user_as_tenant':
        return `Review as Tenant: ${targetName}`;
      case 'user_as_owner':
        return `Review as Owner: ${targetName}`;
      default:
        return `Review: ${targetName}`;
    }
  };

  const getReviewTypeDescription = () => {
    switch (reviewType) {
      case 'property':
        return 'Share your experience with this property to help future renters.';
      case 'user_as_tenant':
        return 'Rate your experience as their tenant.';
      case 'user_as_owner':
        return 'Rate your experience as their landlord.';
      default:
        return 'Share your experience.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{getReviewTypeTitle()}</DialogTitle>
          <p className="text-sm text-muted-foreground">{getReviewTypeDescription()}</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <label id="rating-label" className="text-sm font-medium text-foreground">Rating *</label>
            <div className="flex items-center gap-1" role="group" aria-labelledby="rating-label">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                  aria-pressed={rating === star}
                  className="p-1 hover:scale-110 transition-transform focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground" aria-live="polite">
                {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Review (Optional)</label>
            <Textarea
              placeholder="Share details about your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              maxLength={1000}
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              {reviewText.length}/1000 characters
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createReview.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || createReview.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {createReview.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
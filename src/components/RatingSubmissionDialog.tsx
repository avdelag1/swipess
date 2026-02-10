/**
 * Rating Submission Dialog
 *
 * Full-featured rating submission with:
 * - Category-specific rating questions
 * - Overall rating + detailed category ratings
 * - Review title and text
 * - Verification check (requires completed conversation)
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { StarRatingInput } from './RatingDisplay';
import { useRatingCategory, useCreateRating, useCanRate, useHasRated } from '@/hooks/useRatingSystem';
import type { CreateRatingInput } from '@/hooks/useRatingSystem';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/utils/prodLogger';

interface RatingSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetType: 'listing' | 'user';
  targetName: string;
  categoryId: string;
  onSuccess?: () => void;
}

export function RatingSubmissionDialog({
  open,
  onOpenChange,
  targetId,
  targetType,
  targetName,
  categoryId,
  onSuccess,
}: RatingSubmissionDialogProps) {
  // Fetch category details
  const { data: category, isLoading: isCategoryLoading } = useRatingCategory(categoryId);

  // Check eligibility
  const { data: canRateData, isLoading: isCheckingEligibility } = useCanRate(targetId, targetType);
  const { data: hasRated, isLoading: isCheckingRated } = useHasRated(targetId, targetType);

  // Form state
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({});
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');

  // Mutation
  const createRating = useCreateRating();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setOverallRating(0);
      setCategoryRatings({});
      setReviewTitle('');
      setReviewText('');
    }
  }, [open]);

  // Auto-calculate overall rating from category ratings
  useEffect(() => {
    if (!category || Object.keys(categoryRatings).length === 0) return;

    const questions = category.questions as any[];
    let totalWeight = 0;
    let weightedSum = 0;

    questions.forEach((q) => {
      const rating = categoryRatings[q.id];
      if (rating) {
        weightedSum += rating * (q.weight || 1);
        totalWeight += q.weight || 1;
      }
    });

    if (totalWeight > 0) {
      const calculatedRating = Math.round((weightedSum / totalWeight) * 2) / 2; // Round to nearest 0.5
      setOverallRating(calculatedRating);
    }
  }, [categoryRatings, category]);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      logger.warn('Overall rating is 0');
      return;
    }

    const input: CreateRatingInput = {
      [targetType === 'listing' ? 'listing_id' : 'reviewed_id']: targetId,
      rating: overallRating,
      review_title: reviewTitle.trim() || undefined,
      comment: reviewText.trim() || undefined,
      cleanliness_rating: categoryRatings['cleanliness'],
      communication_rating: categoryRatings['communication'],
      accuracy_rating: categoryRatings['accuracy'],
      location_rating: categoryRatings['location'],
      value_rating: categoryRatings['value'],
    };

    try {
      await createRating.mutateAsync(input);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      logger.error('Error submitting rating:', error);
    }
  };

  const isLoading = isCategoryLoading || isCheckingEligibility || isCheckingRated;
  const canSubmit =
    overallRating > 0 &&
    !createRating.isPending &&
    canRateData?.canRate &&
    !hasRated;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate {targetName}</DialogTitle>
          <DialogDescription>
            Share your experience to help others make informed decisions.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : hasRated ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have already rated this {targetType}. You can update your rating within 24 hours of submission.
            </AlertDescription>
          </Alert>
        ) : !canRateData?.canRate ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {canRateData?.reason || 'You cannot rate this item at this time.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Category-specific rating questions */}
            {category && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Rate your experience</Label>
                {(category.questions as any[]).map((question) => (
                  <div key={question.id} className="space-y-2">
                    <Label htmlFor={`rating-${question.id}`}>{question.question}</Label>
                    <StarRatingInput
                      value={categoryRatings[question.id] || 0}
                      onChange={(value) =>
                        setCategoryRatings((prev) => ({ ...prev, [question.id]: value }))
                      }
                      max={5}
                      size="md"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Overall rating (auto-calculated or manual) */}
            <div className="space-y-2">
              <Label htmlFor="overall-rating" className="text-base font-semibold">
                Overall Rating
              </Label>
              <StarRatingInput
                value={overallRating}
                onChange={setOverallRating}
                max={5}
                size="lg"
              />
              <p className="text-xs text-muted-foreground">
                {Object.keys(categoryRatings).length > 0
                  ? 'Calculated from your category ratings above'
                  : 'Select your overall rating'}
              </p>
            </div>

            {/* Review title */}
            <div className="space-y-2">
              <Label htmlFor="review-title">
                Review Title <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="review-title"
                placeholder="Summarize your experience in one sentence"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {reviewTitle.length}/100 characters
              </p>
            </div>

            {/* Review text */}
            <div className="space-y-2">
              <Label htmlFor="review-text">
                Detailed Review <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="review-text"
                placeholder="Share more details about your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={1000}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {reviewText.length}/1000 characters
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createRating.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {createRating.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Rating'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

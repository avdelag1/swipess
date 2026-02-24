/**
 * Rating System Hooks
 *
 * Re-exports from useReviews.tsx for backward compatibility.
 * The rating system is built on the `reviews` table with support for:
 * - Category-specific ratings (cleanliness, communication, etc.)
 * - Aggregated ratings on profiles (average_rating, total_reviews)
 * - Self-rating prevention via database trigger
 * - Helpful vote tracking
 */

// Re-export everything from the reviews hook
export {
  useListingReviews,
  useListingRatingAggregate,
  useUserReviews,
  useUserRatingAggregate,
  useCreateReview,
  useHasReviewedListing,
  useCanReviewListing,
  useMarkReviewHelpful,
  type Review,
  type ReviewAggregate,
  type CreateReviewInput,
} from './useReviews';

// ============================================================================
// TYPES - Aliases for backward compatibility with existing components
// ============================================================================

import type { Review, ReviewAggregate, CreateReviewInput } from './useReviews';
import { useListingRatingAggregate, useUserRatingAggregate, useHasReviewedListing, useCanReviewListing, useCreateReview, useMarkReviewHelpful } from './useReviews';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

// Rating type alias
export type Rating = Review;
export type RatingAggregate = ReviewAggregate & {
  // Extended fields for UI compatibility
  displayed_rating: number;
  total_ratings: number;
  verified_ratings: number;
  trust_level: 'new' | 'trusted' | 'needs_attention';
  trust_score: number;
  best_review?: Review;
  worst_review?: Review;
};

export type CreateRatingInput = CreateReviewInput;

// Question type for rating categories
export interface RatingQuestion {
  id: string;
  question: string;
  weight: number;
}

// Category type
export interface RatingCategory {
  id: string;
  name: string;
  description: string | null;
  target_type: 'listing' | 'user' | 'worker';
  questions: RatingQuestion[];
  created_at: string;
}

// ============================================================================
// CATEGORY HOOKS
// ============================================================================

// Default categories (hard-coded since we don't have a categories table)
const defaultCategories: RatingCategory[] = [
  {
    id: 'property',
    name: 'Property',
    description: 'Rate a property listing',
    target_type: 'listing',
    questions: [
      { id: 'cleanliness', question: 'How clean was the property?', weight: 1 },
      { id: 'accuracy', question: 'How accurate was the listing?', weight: 1 },
      { id: 'communication', question: 'How was the communication?', weight: 1 },
      { id: 'location', question: 'How was the location?', weight: 1 },
      { id: 'value', question: 'Was it good value for money?', weight: 1 },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'client',
    name: 'Client',
    description: 'Rate a client',
    target_type: 'user',
    questions: [
      { id: 'communication', question: 'How was the communication?', weight: 1 },
      { id: 'cleanliness', question: 'Did they keep the property clean?', weight: 1 },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'worker',
    name: 'Service Provider',
    description: 'Rate a service provider',
    target_type: 'worker',
    questions: [
      { id: 'quality', question: 'How was the quality of work?', weight: 1 },
      { id: 'communication', question: 'How was the communication?', weight: 1 },
      { id: 'timeliness', question: 'Were they on time?', weight: 1 },
    ],
    created_at: new Date().toISOString(),
  },
];

/**
 * Fetch all rating categories
 */
export function useRatingCategories() {
  return useQuery({
    queryKey: ['rating-categories'],
    queryFn: async (): Promise<RatingCategory[]> => {
      return defaultCategories;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

/**
 * Get category by ID
 */
export function useRatingCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['rating-category', categoryId],
    queryFn: async (): Promise<RatingCategory | null> => {
      if (!categoryId) return null;
      return defaultCategories.find(c => c.id === categoryId) || defaultCategories[0];
    },
    enabled: !!categoryId,
    staleTime: 30 * 60 * 1000,
  });
}

// ============================================================================
// ENHANCED AGGREGATE HOOKS (with trust level calculation)
// ============================================================================

/**
 * Calculate trust level based on rating stats
 */
function calculateTrustLevel(average: number, count: number): { level: 'new' | 'trusted' | 'needs_attention'; score: number } {
  if (count === 0) {
    return { level: 'new', score: 100 };
  }
  if (count >= 5 && average >= 4.0) {
    return { level: 'trusted', score: Math.min(100, 50 + count * 2 + (average - 3) * 10) };
  }
  if (average < 3.0 && count >= 3) {
    return { level: 'needs_attention', score: Math.max(0, average * 20) };
  }
  return { level: 'new', score: Math.min(100, count * 10 + average * 10) };
}

/**
 * Get enhanced rating aggregate for a listing with trust level
 */
export function useListingRatingAggregateEnhanced(listingId: string | undefined, categoryId: string = 'property') {
  const baseAggregate = useListingRatingAggregate(listingId);

  return useQuery({
    queryKey: ['rating-aggregate-enhanced', 'listing', listingId, categoryId],
    queryFn: async (): Promise<RatingAggregate | null> => {
      if (!baseAggregate.data) return null;

      const { level, score } = calculateTrustLevel(
        baseAggregate.data.average_rating,
        baseAggregate.data.total_reviews
      );

      return {
        ...baseAggregate.data,
        displayed_rating: baseAggregate.data.average_rating,
        total_ratings: baseAggregate.data.total_reviews,
        verified_ratings: 0,
        trust_level: level,
        trust_score: score,
      };
    },
    enabled: !!listingId && !!baseAggregate.data,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get enhanced rating aggregate for a user with trust level
 */
export function useUserRatingAggregateEnhanced(userId: string | undefined, categoryId: string = 'client') {
  const baseAggregate = useUserRatingAggregate(userId);

  return useQuery({
    queryKey: ['rating-aggregate-enhanced', 'user', userId, categoryId],
    queryFn: async (): Promise<RatingAggregate | null> => {
      if (!baseAggregate.data) return null;

      const { level, score } = calculateTrustLevel(
        baseAggregate.data.average_rating,
        baseAggregate.data.total_reviews
      );

      return {
        ...baseAggregate.data,
        displayed_rating: baseAggregate.data.average_rating,
        total_ratings: baseAggregate.data.total_reviews,
        verified_ratings: 0,
        trust_level: level,
        trust_score: score,
      };
    },
    enabled: !!userId && !!baseAggregate.data,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================

/** Alias for backward compatibility */
export const useListingRatings = (listingId: string | undefined, options?: { limit?: number }) => {
  const { useListingReviews } = require('./useReviews');
  return useListingReviews(listingId, options);
};

/** Alias for backward compatibility */
export const useUserRatings = (userId: string | undefined, options?: { limit?: number }) => {
  const { useUserReviews } = require('./useReviews');
  return useUserReviews(userId, options);
};

/** Alias for useCreateReview */
export const useCreateRating = useCreateReview;

/** Alias for useMarkReviewHelpful */
export const useMarkRatingHelpful = useMarkReviewHelpful;

/** Check if user has rated (alias for useHasReviewedListing) */
export function useHasRated(targetId: string | undefined, targetType: 'listing' | 'user') {
  const { user } = useAuth();
  return useHasReviewedListing(targetType === 'listing' ? targetId : undefined);
}

/** Check if user can rate (alias for useCanReviewListing) */
export function useCanRate(targetId: string | undefined, targetType: 'listing' | 'user') {
  const canReview = useCanReviewListing(targetType === 'listing' ? targetId : undefined);
  
  return useQuery({
    queryKey: ['can-rate', targetId, targetType],
    queryFn: async () => {
      if (targetType === 'user') {
        // For user ratings, allow if not self
        return { canRate: true };
      }
      return {
        canRate: canReview.data?.canReview ?? false,
        reason: canReview.data?.reason,
      };
    },
    enabled: !!targetId,
    staleTime: 60 * 1000,
  });
}

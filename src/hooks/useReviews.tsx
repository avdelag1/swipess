/**
 * Reviews System Hooks
 *
 * Connects to the Supabase `reviews` table to provide:
 * - Fetch reviews for listings and users
 * - Create reviews with category ratings
 * - Mark reviews as helpful
 * - Check if user can/has reviewed
 * - Profile rating aggregates (average_rating, total_reviews)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import { logger } from '@/utils/prodLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface Review {
  id: string;
  reviewer_id: string;
  listing_id?: string;
  reviewed_id?: string;
  reviewed_user_id?: string; // Legacy alias for reviewed_id
  rating: number;
  comment?: string;
  review_text?: string; // Legacy alias for comment
  review_title?: string;
  review_type: 'client_to_owner' | 'owner_to_client' | 'property' | 'user_as_tenant' | 'user_as_owner';
  cleanliness_rating?: number;
  communication_rating?: number;
  accuracy_rating?: number;
  location_rating?: number;
  value_rating?: number;
  response_text?: string;
  responded_at?: string;
  is_verified_stay: boolean;
  is_verified?: boolean; // Legacy alias
  is_flagged: boolean;
  helpful_count: number;
  created_at: string;
  updated_at?: string;
  reviewer?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  reviewer_profile?: { // Legacy alias
    full_name: string;
    avatar_url?: string;
  };
}

export interface ReviewAggregate {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<string, number>;
  // Required fields for UI compatibility
  displayed_rating: number;
  total_ratings: number;
  verified_ratings: number;
  trust_level: 'new' | 'trusted' | 'needs_attention';
  trust_score: number;
}

export interface CreateReviewInput {
  listing_id?: string;
  reviewed_id?: string;
  reviewed_user_id?: string; // Legacy alias for reviewed_id
  rating: number;
  comment?: string;
  review_text?: string; // Legacy alias for comment
  review_title?: string;
  review_type?: 'client_to_owner' | 'owner_to_client' | 'property' | 'user_as_tenant' | 'user_as_owner';
  cleanliness_rating?: number;
  communication_rating?: number;
  accuracy_rating?: number;
  location_rating?: number;
  value_rating?: number;
}

// Legacy type alias
export type CreateReviewData = CreateReviewInput;

// ============================================================================
// LISTING REVIEWS
// ============================================================================

/**
 * Get all reviews for a listing
 */
export function useListingReviews(listingId: string | undefined, options: { limit?: number } = {}) {
  return useQuery({
    queryKey: ['reviews', 'listing', listingId, options.limit],
    queryFn: async (): Promise<Review[]> => {
      if (!listingId) return [];

      let query = supabase
        .from('reviews')
        .select(`
          id,
          reviewer_id,
          listing_id,
          rating,
          comment,
          review_title,
          review_type,
          cleanliness_rating,
          communication_rating,
          accuracy_rating,
          location_rating,
          value_rating,
          response_text,
          responded_at,
          is_verified_stay,
          is_flagged,
          helpful_count,
          created_at,
          updated_at
        `)
        .eq('listing_id', listingId)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching listing reviews:', error);
        return [];
      }

      return (data || []).map(r => ({
        ...r,
        review_type: r.review_type || 'property',
        is_verified_stay: r.is_verified_stay ?? false,
        is_flagged: r.is_flagged ?? false,
        helpful_count: r.helpful_count ?? 0,
      })) as Review[];
    },
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get rating aggregate for a listing (accepts optional categoryId for compatibility)
 */
export function useListingRatingAggregate(listingId: string | undefined, _categoryId?: string) {
  return useQuery({
    queryKey: ['review-aggregate', 'listing', listingId],
    queryFn: async (): Promise<ReviewAggregate | null> => {
      if (!listingId) return null;

      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('listing_id', listingId)
        .eq('is_flagged', false);

      if (error) {
        logger.error('Error fetching listing rating aggregate:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          average_rating: 5.0,
          total_reviews: 0,
          rating_distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
          displayed_rating: 5.0,
          total_ratings: 0,
          verified_ratings: 0,
          trust_level: 'new' as const,
          trust_score: 100,
        };
      }

      // Calculate aggregate
      const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      let sum = 0;

      data.forEach((r) => {
        const rating = Math.round(Number(r.rating));
        if (rating >= 1 && rating <= 5) {
          distribution[rating.toString()]++;
          sum += Number(r.rating);
        }
      });

      const avgRating = sum / data.length;
      const trustLevel = data.length >= 5 && avgRating >= 4.0 ? 'trusted' as const : 
                         avgRating < 3.0 && data.length >= 3 ? 'needs_attention' as const : 'new' as const;

      return {
        average_rating: avgRating,
        total_reviews: data.length,
        rating_distribution: distribution,
        displayed_rating: avgRating,
        total_ratings: data.length,
        verified_ratings: 0,
        trust_level: trustLevel,
        trust_score: Math.min(100, data.length * 10 + avgRating * 10),
      };
    },
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}


// ============================================================================
// USER REVIEWS
// ============================================================================

/**
 * Get all reviews for a user (as reviewed party)
 */
export function useUserReviews(userId: string | undefined, options: { limit?: number } = {}) {
  return useQuery({
    queryKey: ['reviews', 'user', userId, options.limit],
    queryFn: async (): Promise<Review[]> => {
      if (!userId) return [];

      let query = supabase
        .from('reviews')
        .select(`
          id,
          reviewer_id,
          reviewed_id,
          listing_id,
          rating,
          comment,
          review_title,
          review_type,
          cleanliness_rating,
          communication_rating,
          helpful_count,
          created_at
        `)
        .eq('reviewed_id', userId)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching user reviews:', error);
        return [];
      }

      return (data || []).map(r => ({
        ...r,
        review_type: r.review_type || 'property',
        is_verified_stay: false,
        is_flagged: false,
        helpful_count: r.helpful_count ?? 0,
      })) as Review[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get user's profile rating aggregate (uses profiles.average_rating)
 */
export function useUserRatingAggregate(userId: string | undefined) {
  return useQuery({
    queryKey: ['review-aggregate', 'user', userId],
    queryFn: async (): Promise<ReviewAggregate | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('average_rating, total_reviews')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching user rating aggregate:', error);
        return null;
      }

      if (!data) {
        return {
          average_rating: 5.0,
          total_reviews: 0,
          rating_distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
          displayed_rating: 5.0,
          total_ratings: 0,
          verified_ratings: 0,
          trust_level: 'new' as const,
          trust_score: 100,
        };
      }

      const avgRating = Number(data.average_rating) || 5.0;
      const count = data.total_reviews || 0;
      const trustLevel = count >= 5 && avgRating >= 4.0 ? 'trusted' as const : 
                         avgRating < 3.0 && count >= 3 ? 'needs_attention' as const : 'new' as const;

      return {
        average_rating: avgRating,
        total_reviews: count,
        rating_distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        displayed_rating: avgRating,
        total_ratings: count,
        verified_ratings: 0,
        trust_level: trustLevel,
        trust_score: Math.min(100, count * 10 + avgRating * 10),
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

// ============================================================================
// CREATE REVIEW
// ============================================================================

/**
 * Create a new review
 */
export function useCreateReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput): Promise<Review | null> => {
      if (!user?.id) {
        throw new Error('Must be logged in to submit a review');
      }

      if (!input.listing_id && !input.reviewed_id) {
        throw new Error('Must specify a listing or user to review');
      }

      const insertData: any = {
        reviewer_id: user.id,
        listing_id: input.listing_id || null,
        reviewed_id: input.reviewed_id || input.reviewed_user_id || null,
        rating: input.rating,
        comment: input.comment || input.review_text || null,
        review_title: input.review_title || null,
        review_type: input.review_type || 'property',
        cleanliness_rating: input.cleanliness_rating || null,
        communication_rating: input.communication_rating || null,
        accuracy_rating: input.accuracy_rating || null,
        location_rating: input.location_rating || null,
        value_rating: input.value_rating || null,
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating review:', error);
        throw error;
      }

      return data as Review;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      if (variables.listing_id) {
        queryClient.invalidateQueries({ queryKey: ['reviews', 'listing', variables.listing_id] });
        queryClient.invalidateQueries({ queryKey: ['review-aggregate', 'listing', variables.listing_id] });
      }
      if (variables.reviewed_id) {
        queryClient.invalidateQueries({ queryKey: ['reviews', 'user', variables.reviewed_id] });
        queryClient.invalidateQueries({ queryKey: ['review-aggregate', 'user', variables.reviewed_id] });
      }

      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!',
      });
    },
    onError: (error: any) => {
      const message = error.message?.includes('Cannot review your own')
        ? "You can't review your own listing"
        : error.message?.includes('duplicate key')
        ? 'You have already reviewed this item'
        : 'Please try again later.';

      toast({
        title: 'Failed to submit review',
        description: message,
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// CHECK IF USER CAN REVIEW
// ============================================================================

/**
 * Check if current user has already reviewed a listing
 */
export function useHasReviewedListing(listingId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['has-reviewed', 'listing', user?.id, listingId],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id || !listingId) return false;

      const { data, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('reviewer_id', user.id)
        .eq('listing_id', listingId)
        .maybeSingle();

      if (error) {
        logger.error('Error checking if reviewed:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id && !!listingId,
    staleTime: 30 * 1000,
  });
}

/**
 * Check if current user can review a listing (hasn't reviewed + not owner)
 */
export function useCanReviewListing(listingId: string | undefined) {
  const { user } = useAuth();
  const { data: hasReviewed } = useHasReviewedListing(listingId);

  return useQuery({
    queryKey: ['can-review', 'listing', user?.id, listingId],
    queryFn: async (): Promise<{ canReview: boolean; reason?: string }> => {
      if (!user?.id || !listingId) {
        return { canReview: false, reason: 'Not authenticated' };
      }

      // Check if user owns the listing
      const { data: listing } = await supabase
        .from('listings')
        .select('owner_id')
        .eq('id', listingId)
        .maybeSingle();

      if (listing?.owner_id === user.id) {
        return { canReview: false, reason: "You can't review your own listing" };
      }

      if (hasReviewed) {
        return { canReview: false, reason: 'You have already reviewed this listing' };
      }

      return { canReview: true };
    },
    enabled: !!user?.id && !!listingId && hasReviewed !== undefined,
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// MARK REVIEW HELPFUL
// ============================================================================

/**
 * Mark a review as helpful
 */
export function useMarkReviewHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.rpc('increment_review_helpful', {
        p_review_id: reviewId,
      });

      if (error) {
        logger.error('Error marking review helpful:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate review queries to show updated count
      queryClient.invalidateQueries({ queryKey: ['reviews'] });

      toast({
        title: 'Thank you',
        description: 'Your feedback helps improve our community.',
      });
    },
    onError: () => {
      toast({
        title: 'Already voted',
        description: "You've already marked this review as helpful.",
        variant: 'default',
      });
    },
  });
}

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

/** @deprecated Use useListingReviews or useUserReviews instead */
export const useReviews = (targetType: 'user' | 'property', targetId: string) => {
  if (targetType === 'property') {
    return useListingReviews(targetId);
  }
  return useUserReviews(targetId);
};

/** @deprecated Use useUserRatingAggregate instead */
export const useUserReviewStats = (userId: string) => {
  return useUserRatingAggregate(userId);
};

/** @deprecated Use useListingRatingAggregate instead */
export const usePropertyReviewStats = (listingId: string) => {
  return useListingRatingAggregate(listingId);
};

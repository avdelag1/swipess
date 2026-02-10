import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/prodLogger';
import { toast } from './use-toast';

export type DismissalTargetType = 'listing' | 'client';

interface DismissalResult {
  is_permanent: boolean;
  dismiss_count: number;
}

/**
 * Hook to manage swipe dismissals using the unified likes table
 * 
 * Uses direction='left' in likes table for dismissals
 */
export function useSwipeDismissal(targetType: DismissalTargetType) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query to get active dismissals (left swipes)
  const {
    data: dismissedIds = [],
    isLoading,
    refetch: refetchDismissals,
  } = useQuery({
    queryKey: ['swipe-dismissals', user?.id, targetType],
    queryFn: async (): Promise<string[]> => {
      if (!user?.id) return [];

      try {
        // Query likes table for left swipes (dismissals)
        const dbTargetType = targetType === 'client' ? 'profile' : 'listing';
        
        const { data, error } = await supabase
          .from('likes')
          .select('target_id')
          .eq('user_id', user.id)
          .eq('target_type', dbTargetType)
          .eq('direction', 'left');

        if (error) {
          logger.error('[useSwipeDismissal] Error fetching dismissals:', error);
          return [];
        }

        // Extract target_ids from result
        const ids = (data || []).map((item) => item.target_id);
        logger.info(`[useSwipeDismissal] Loaded ${ids.length} active ${targetType} dismissals`);
        return ids;
      } catch (error) {
        logger.error('[useSwipeDismissal] Unexpected error:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Mutation to dismiss a target (listing or client)
  const dismissMutation = useMutation({
    mutationFn: async (targetId: string): Promise<DismissalResult> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const dbTargetType = targetType === 'client' ? 'profile' : 'listing';

      // Insert/update in likes table with direction='dismiss'
      // Unique constraint is on (user_id, target_id, target_type)
      const { error } = await supabase
        .from('likes')
        .upsert({
          user_id: user.id,
          target_id: targetId,
          target_type: dbTargetType,
          direction: 'left'
        }, {
          onConflict: 'user_id,target_id,target_type',
        });

      if (error) {
        logger.error('[useSwipeDismissal] Error dismissing target:', error);
        throw error;
      }

      // Return a simple result
      return { is_permanent: false, dismiss_count: 1 };
    },
    onSuccess: (result, targetId) => {
      // Invalidate and refetch dismissals
      queryClient.invalidateQueries({
        queryKey: ['swipe-dismissals', user?.id, targetType]
      });

      logger.info(`[useSwipeDismissal] Dismissed ${targetType} ${targetId}:`, result);
    },
    onError: (error) => {
      logger.error('[useSwipeDismissal] Error in dismiss mutation:', error);
      toast({
        title: 'Error',
        description: 'Failed to dismiss item. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Function to dismiss a target
  const dismissTarget = useCallback(
    (targetId: string) => {
      return dismissMutation.mutateAsync(targetId);
    },
    [dismissMutation]
  );

  // Function to check if a target is dismissed
  const isDismissed = useCallback(
    (targetId: string) => {
      return dismissedIds.includes(targetId);
    },
    [dismissedIds]
  );

  // Function to filter out dismissed items from a list
  const filterDismissed = useCallback(
    <T extends { id: string }>(items: T[]): T[] => {
      if (!dismissedIds.length) return items;
      return items.filter(item => !dismissedIds.includes(item.id));
    },
    [dismissedIds]
  );

  return {
    // State
    dismissedIds,
    isLoading,

    // Actions
    dismissTarget,
    isDismissed,
    filterDismissed,
    refetchDismissals,

    // Mutation state
    isDismissing: dismissMutation.isPending,
  };
}

/**
 * Hook to track dismissals from swipe actions
 * Integrates with useSwipe to auto-dismiss on left swipe
 */
export function useSwipeDismissalTracking(targetType: DismissalTargetType) {
  const { dismissTarget, isDismissing } = useSwipeDismissal(targetType);

  // Function to track dismissal on left swipe
  const trackDismissal = useCallback(
    async (targetId: string, direction: 'left' | 'right') => {
      // Only dismiss on left swipe (dislike)
      if (direction === 'left') {
        try {
          await dismissTarget(targetId);
        } catch (error) {
          // Error already logged and toasted in mutation
          logger.error('[useSwipeDismissalTracking] Failed to track dismissal:', error);
        }
      }
    },
    [dismissTarget]
  );

  return {
    trackDismissal,
    isDismissing,
  };
}

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { appToast } from '@/utils/appNotification';
import { logger } from '@/utils/prodLogger';
import { useSwipeDeckStore } from '@/state/swipeDeckStore';

export interface LastSwipe {
  targetId: string;
  targetType: 'listing' | 'profile';
  direction: 'left' | 'right';
  timestamp: Date;
  category?: string; // For owner swipes to restore correct deck
}

const UNDO_STORAGE_KEY = 'swipe_lastSwipe';

export function useSwipeUndo() {
  const [lastSwipe, setLastSwipe] = useState<LastSwipe | null>(() => {
    const stored = localStorage.getItem(UNDO_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...parsed, timestamp: new Date(parsed.timestamp) };
      } catch {
        return null;
      }
    }
    return null;
  });

  // Track if the undo was successful for components to react
  const [undoSuccess, setUndoSuccess] = useState(false);
  
  const queryClient = useQueryClient();
  const undoClientSwipe = useSwipeDeckStore((state) => state.undoClientSwipe);
  const undoOwnerSwipe = useSwipeDeckStore((state) => state.undoOwnerSwipe);

  // Reset undo success state
  const resetUndoState = useCallback(() => {
    setUndoSuccess(false);
  }, []);

  // Save last swipe to localStorage
  const saveLastSwipe = useCallback((swipe: LastSwipe | null) => {
    setLastSwipe(swipe);
    if (swipe) {
      localStorage.setItem(UNDO_STORAGE_KEY, JSON.stringify(swipe));
    } else {
      localStorage.removeItem(UNDO_STORAGE_KEY);
    }
  }, []);

  // Record a swipe for potential undo
  const recordSwipe = useCallback((
    targetId: string,
    targetType: 'listing' | 'profile',
    direction: 'left' | 'right',
    category?: string
  ) => {
    // Only save left swipes for undo
    if (direction === 'left') {
      saveLastSwipe({ targetId, targetType, direction, timestamp: new Date(), category });
    } else {
      // Right swipes clear the undo state
      saveLastSwipe(null);
    }
  }, [saveLastSwipe]);

  // Undo mutation - removes the swipe from the likes table
  const undoMutation = useMutation({
    mutationFn: async () => {
      if (!lastSwipe) {
        throw new Error('Nothing to undo');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Remove from likes table (unified swipe storage)
      // Include target_type to match the unique constraint
      const { error: likesError } = await supabase
        .from('likes')
        .delete()
        .match({
          user_id: user.id,
          target_id: lastSwipe.targetId,
          target_type: lastSwipe.targetType
        });

      if (likesError) {
        logger.error('[useSwipeUndo] Delete error:', likesError);
        throw likesError;
      }

      // Revert strike in profile_views
      const { data: view } = await supabase
        .from('profile_views')
        .select('action')
        .match({
          user_id: user.id,
          viewed_profile_id: lastSwipe.targetId,
          view_type: lastSwipe.targetType === 'profile' ? 'profile' : 'listing'
        })
        .single();

      if (view?.action?.startsWith('pass:')) {
        const count = parseInt(view.action.split(':')[1]) || 1;
        if (count > 1) {
          // Decrement strike
          await supabase
            .from('profile_views')
            .update({ action: `pass:${count - 1}` })
            .match({
              user_id: user.id,
              viewed_profile_id: lastSwipe.targetId,
              view_type: lastSwipe.targetType === 'profile' ? 'profile' : 'listing'
            });
        } else {
          // Delete strike
          await supabase
            .from('profile_views')
            .delete()
            .match({
              user_id: user.id,
              viewed_profile_id: lastSwipe.targetId,
              view_type: lastSwipe.targetType === 'profile' ? 'profile' : 'listing'
            });
        }
      }

      return lastSwipe;
    },
    onSuccess: (swiped) => {
      // Bring card back in the deck
      if (swiped.targetType === 'listing') {
        undoClientSwipe();
      } else {
        undoOwnerSwipe(swiped.category || 'property');
      }

      // Mark undo as successful
      setUndoSuccess(true);

      // Clear undo state
      saveLastSwipe(null);

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['swipe-dismissals'] }).catch(err => logger.error('[useSwipeUndo] Invalidation failed:', err));
      queryClient.invalidateQueries({ queryKey: ['listings'] }).catch(err => logger.error('[useSwipeUndo] Invalidation failed:', err));
      queryClient.invalidateQueries({ queryKey: ['liked-properties'] }).catch(err => logger.error('[useSwipeUndo] Invalidation failed:', err));

      appToast.success('↩️ Card Returned', 'The card is back in your deck.');
    },
    onError: (error) => {
      logger.error('[useSwipeUndo] Error:', error);
      appToast.error('Could not undo', 'Please try again.');
    }
  });

  const canUndo = lastSwipe !== null;
  const isUndoing = undoMutation.isPending;

  return {
    recordSwipe,
    undoLastSwipe: undoMutation.mutate,
    canUndo,
    isUndoing,
    lastSwipe,
    undoSuccess,
    resetUndoState
  };
}



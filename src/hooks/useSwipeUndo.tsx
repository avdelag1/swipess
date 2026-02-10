import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
      const { error } = await supabase
        .from('likes')
        .delete()
        .match({
          user_id: user.id,
          target_id: lastSwipe.targetId,
          target_type: lastSwipe.targetType
        });

      if (error) {
        logger.error('[useSwipeUndo] Delete error:', error);
        throw error;
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
      queryClient.invalidateQueries({ queryKey: ['swipe-dismissals'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['listings'] }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['liked-properties'] }).catch(() => {});

      toast({
        title: '↩️ Card Returned',
        description: 'The card is back in your deck.',
      });
    },
    onError: (error) => {
      logger.error('[useSwipeUndo] Error:', error);
      toast({
        title: 'Could not undo',
        description: 'Please try again.',
        variant: 'destructive'
      });
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

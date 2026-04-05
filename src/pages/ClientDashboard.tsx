import { useCallback } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { SwipeAllDashboard } from '@/components/swipe/SwipeAllDashboard';

interface ClientDashboardProps {
  onPropertyInsights?: (listingId: string) => void;
  onMessageClick?: () => void;
}

/**
 * Client Dashboard — Poker card fan when no category selected,
 * full swipe deck when a category is active.
 */
export default function ClientDashboard({
  onPropertyInsights,
  onMessageClick,
}: ClientDashboardProps) {
  const activeCategory = useFilterStore(s => s.activeCategory);
  const { setCategories } = useFilterActions();

  const handleListingTap = useCallback((listingId: string) => {
    onPropertyInsights?.(listingId);
  }, [onPropertyInsights]);

  // When no category is selected, show the poker card fan
  if (!activeCategory) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden">
        <SwipeAllDashboard setCategories={(ids) => {
          if (ids.length > 0) {
            setCategories(ids);
          }
        }} />
      </div>
    );
  }

  return (
    <SwipessSwipeContainer
      onListingTap={handleListingTap}
      onInsights={handleListingTap}
      onMessageClick={onMessageClick}
    />
  );
}

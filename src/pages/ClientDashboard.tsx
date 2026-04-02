import { useCallback } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore } from '@/state/filterStore';
import { MyHubQuickFilters } from '@/components/MyHubQuickFilters';

interface ClientDashboardProps {
  onPropertyInsights?: (listingId: string) => void;
  onMessageClick?: () => void;
}

/**
 * SPEED OF LIGHT: Client Dashboard
 * Shows quick filter category cards when no category is selected,
 * and the swipe deck when a category is active.
 */
export default function ClientDashboard({
  onPropertyInsights,
  onMessageClick,
}: ClientDashboardProps) {
  const activeCategory = useFilterStore(s => s.activeCategory);

  const handleListingTap = useCallback((listingId: string) => {
    onPropertyInsights?.(listingId);
  }, [onPropertyInsights]);

  // When no category is selected, show the category picker
  if (!activeCategory) {
    return <MyHubQuickFilters />;
  }

  return (
    <SwipessSwipeContainer
      onListingTap={handleListingTap}
      onInsights={handleListingTap}
      onMessageClick={onMessageClick}
    />
  );
}

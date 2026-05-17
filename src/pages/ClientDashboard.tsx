import { useEffect, useMemo } from 'react';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore } from '@/state/filterStore';
import { cn } from '@/lib/utils';
import { useSmartListingMatching } from '@/hooks/smartMatching/useSmartListingMatching';
import { useAuth } from '@/hooks/useAuth';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { revealChrome } from '@/hooks/useChromeReveal';

interface ClientDashboardProps {
  onMessageClick?: () => void;
}

export default function ClientDashboard({ onMessageClick }: ClientDashboardProps) {
  const { user } = useAuth();

  useEffect(() => {
    // Show the HUD briefly when entering the dashboard
    revealChrome();
  }, []);

  const filterVersion = useFilterStore(s => s.filterVersion);
  const filters = useMemo(
    () => useFilterStore.getState().getListingFilters(),
    [filterVersion]
  );

  // Pre-fetch listing data so the swipe deck is ready instantly
  useSmartListingMatching(user?.id, [], filters, 0, 20, false);

  return (
    <div
      className={cn(
        "flex-1 flex flex-col relative w-full min-h-0 bg-swipe-frame"
      )}
      style={{
        willChange: 'transform',
      }}
    >
      <AtmosphericLayer variant="Swipes" />

      <div className="flex-1 flex flex-col min-h-0">
        <SwipessSwipeContainer
          onListingTap={() => {}}
          onInsights={() => {}}
          onMessageClick={onMessageClick}
        />
      </div>
    </div>
  );
}


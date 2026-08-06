import { useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore } from '@/state/filterStore';
import { cn } from '@/lib/utils';
import { revealChrome } from '@/hooks/useChromeReveal';

interface ClientDashboardProps {
  onMessageClick?: () => void;
}

export default function ClientDashboard({ onMessageClick }: ClientDashboardProps) {
  const navigate = useNavigate();

  // Landing on the dashboard always shows the quick-filter photo cards.
  // Runs before paint so a previously-persisted category never flashes its
  // deck before resetting. (Heals users whose old localStorage still has one.)
  useLayoutEffect(() => {
    useFilterStore.getState().setActiveCategory(null);
  }, []);

  useEffect(() => {
    // Show the HUD briefly when entering the dashboard
    revealChrome();
  }, []);

  return (
    <div className={cn('relative w-full flex-1 min-h-0 bg-transparent')}>
      <SwipessSwipeContainer
        onListingTap={(listingId) => navigate(`/listing/${listingId}`)}
        onInsights={() => {}}
        onMessageClick={onMessageClick}
      />
    </div>
  );
}

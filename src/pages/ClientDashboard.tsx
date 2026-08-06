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
  useLayoutEffect(() => {
    useFilterStore.getState().setActiveCategory(null);
  }, []);

  useEffect(() => {
    revealChrome();
  }, []);

  return (
    <div className={cn('relative w-full flex-1 min-h-0 bg-transparent')}>

      <div className="relative z-10 w-full h-full flex flex-col">
        <SwipessSwipeContainer
          onListingTap={(listingId) => navigate(`/listing/${listingId}`)}
          onInsights={() => {}}
          onMessageClick={onMessageClick}
        />
      </div>
    </div>
  );
}

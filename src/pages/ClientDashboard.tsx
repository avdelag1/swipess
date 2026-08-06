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
    <div className={cn('relative w-full flex-1 min-h-0 bg-black overflow-hidden')}>
      {/* Single Sunset Orb - Centered behind cards, moving up and down */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div 
          className="w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] rounded-full opacity-80 blur-[80px] animate-orb-center" 
          style={{ 
            background: 'radial-gradient(circle, rgba(255,50,0,0.85) 0%, rgba(255,140,0,0.6) 40%, rgba(255,200,0,0) 70%)' 
          }} 
        />
      </div>

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

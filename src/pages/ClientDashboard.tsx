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
      {/* Sunset Orbs - Fast Moving */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] md:w-[60vh] md:h-[60vh] rounded-full opacity-60 blur-[60px] animate-orb-1" 
             style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.8) 0%, rgba(255,200,0,0) 70%)' }} />
        <div className="absolute top-[20%] right-[-20%] w-[70vw] h-[70vw] md:w-[70vh] md:h-[70vh] rounded-full opacity-50 blur-[80px] animate-orb-2" 
             style={{ background: 'radial-gradient(circle, rgba(255,20,50,0.6) 0%, rgba(255,100,0,0) 70%)' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] md:w-[50vh] md:h-[50vh] rounded-full opacity-50 blur-[70px] animate-orb-3" 
             style={{ background: 'radial-gradient(circle, rgba(138,43,226,0.5) 0%, rgba(255,165,0,0) 70%)' }} />
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

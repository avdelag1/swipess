import { useEffect, useLayoutEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore } from '@/state/filterStore';
import { cn } from '@/lib/utils';
import { useSmartListingMatching } from '@/hooks/smartMatching/useSmartListingMatching';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingStore } from '@/state/onboardingStore';
import { useModalStore } from '@/state/modalStore';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { revealChrome } from '@/hooks/useChromeReveal';

interface ClientDashboardProps {
  onMessageClick?: () => void;
}

export default function ClientDashboard({ onMessageClick }: ClientDashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { hasSeenOnboarding, setOnboardingActive, markOnboardingSeen } = useOnboardingStore();
  const { setModal } = useModalStore();

  // Landing on the dashboard always shows the quick-filter photo cards.
  // Runs before paint so a previously-persisted category never flashes its
  // deck before resetting. (Heals users whose old localStorage still has one.)
  useLayoutEffect(() => {
    useFilterStore.getState().setActiveCategory(null);
  }, []);

  useEffect(() => {
    if (user && !hasSeenOnboarding) {
      setTimeout(() => {
        setOnboardingActive(true);
        setModal('showAIProfile', true);
        markOnboardingSeen();
      }, 1000);
    }
  }, [user, hasSeenOnboarding, setOnboardingActive, setModal, markOnboardingSeen]);

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
          onListingTap={(listingId) => navigate(`/listing/${listingId}`)}
          onInsights={() => {}}
          onMessageClick={onMessageClick}
        />
      </div>
    </div>
  );
}


import { useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SwipessSwipeContainer } from '@/components/SwipessSwipeContainer';
import { useFilterStore } from '@/state/filterStore';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingStore } from '@/state/onboardingStore';
import { useModalStore } from '@/state/modalStore';
import { AmbientPageBackground } from '@/components/ui/AmbientPageBackground';
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
    if (!user || hasSeenOnboarding) return;
    const run = () => {
      setOnboardingActive(true);
      setModal('showAIProfile', true);
      markOnboardingSeen();
    };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(run, 400);
    return () => clearTimeout(t);
  }, [user, hasSeenOnboarding, setOnboardingActive, setModal, markOnboardingSeen]);

  useEffect(() => {
    // Show the HUD briefly when entering the dashboard
    revealChrome();
  }, []);

  return (
    <AmbientPageBackground
      layout="fill"
      className={cn('relative w-full min-h-0 bg-swipe-frame')}
      variant="subtle"
    >
      <SwipessSwipeContainer
        onListingTap={(listingId) => navigate(`/listing/${listingId}`)}
        onInsights={() => {}}
        onMessageClick={onMessageClick}
      />
    </AmbientPageBackground>
  );
}


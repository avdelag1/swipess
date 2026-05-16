import { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useFilterPersistence } from '@/hooks/useFilterPersistence';
import { useMatchRealtime } from '@/hooks/useMatchRealtime';
import { useLikesRealtime } from '@/hooks/useLikesRealtime';
import { lazyWithRetry } from '@/utils/lazyRetry';

const MatchCelebration = lazyWithRetry(() => import('@/components/MatchCelebration').then(m => ({ default: m.MatchCelebration })));

export function PersistentDashboardSubscriptions() {
  const navigate = useNavigate();
  const [isWarmedUp, setIsWarmedUp] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsWarmedUp(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // FILTER PERSISTENCE: Auto-restore and auto-save filters from/to database
  useFilterPersistence();

  // GLOBAL MATCH CELEBRATION: Real-time listener for match events across the entire dashboard
  const { matchCelebration, closeCelebration } = useMatchRealtime(isWarmedUp);

  // GLOBAL LIKES SYNC: Ensures saves and favorites stay in sync across tabs and devices
  useLikesRealtime(isWarmedUp);

  if (!matchCelebration.isOpen) return null;

  return createPortal(
    <Suspense fallback={null}>
      <MatchCelebration
        isOpen={matchCelebration.isOpen}
        onClose={closeCelebration}
        matchedUser={{
          name: matchCelebration.matchedUser?.name || 'Someone',
          avatar: matchCelebration.matchedUser?.avatar,
          role: matchCelebration.matchedUser?.role || 'client'
        }}
        onMessage={() => {
          // Redirect to messages upon match interaction
          closeCelebration();
          navigate('/messages');
        }}
      />
    </Suspense>,
    document.body
  );
}

export default PersistentDashboardSubscriptions;

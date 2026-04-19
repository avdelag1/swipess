import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DiscoveryFilters } from '@/components/filters/DiscoveryFilters';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Filter, User, ArrowLeft, Sparkles, Building2, Bike, Trophy, Heart, Coins, Wrench } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSmartClientMatching, ClientFilters } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useStartConversation } from '@/hooks/useConversations';
import { toast as sonnerToast } from 'sonner';
import { triggerHaptic } from '@/utils/haptics';
import { Badge } from '@/components/ui/badge';
import { ClientCard } from '@/components/discovery/ClientCard';
import { DiscoverySkeleton } from '@/components/ui/DiscoverySkeleton';
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import OwnerInterestedClients from './OwnerInterestedClients';
import OwnerLikedClients from './OwnerLikedClients';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

import { DiscoveryMapView } from '@/components/swipe/DiscoveryMapView';

type DiscoveryTab = 'radar' | 'interested' | 'saved';
type RadarCategory = 'property' | 'motorcycle' | 'bicycle' | 'worker';

export default function OwnerDiscovery() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialCategory = useMemo(() => {
    if (location.pathname.includes('/moto')) return 'motorcycle';
    if (location.pathname.includes('/bicycle')) return 'bicycle';
    if (location.pathname.includes('/property')) return 'property';
    return 'property';
  }, [location.pathname]);

  const [radarCategory, setRadarCategory] = useState<RadarCategory>(initialCategory);

  return (
    <div className="w-full h-screen fixed inset-0 z-[50] bg-black">
      <DiscoveryMapView
        category={radarCategory}
        onBack={() => navigate('/owner/dashboard')}
        onStartSwiping={() => {
          triggerHaptic('heavy');
          navigate('/owner/dashboard');
        }}
        onCategoryChange={(cat) => setRadarCategory(cat as any)}
        mode="owner"
      />
    </div>
  );
}
  );
}

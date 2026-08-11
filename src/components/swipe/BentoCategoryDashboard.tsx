import { memo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import type { QuickFilterCategory } from '@/types/filters';
import { cn } from '@/lib/utils';
import { QuickFilterImage } from '@/components/ui/QuickFilterImage';
import { POKER_CARD_PHOTOS } from './SwipeConstants';
import { EVENTS_FEED_PATH } from '@/constants/eventsRoutes';
import { prefetchEventCategoryPhotosImmediate } from '@/utils/prefetchEventCategoryPhotos';
import {
  prefetchQuickFilterDeck,
  resolveQuickFilterDeckTarget,
} from '@/utils/prefetchQuickFilterDeck';
import { useAuth } from '@/hooks/useAuth';
import {
  Anchor,
  Bike,
  Briefcase,
  Home,
  Search,
  Star,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { AISearchBar } from '@/components/AISearchBar';
import { AIDisclosure } from '@/components/AIDisclosure';
import { DashboardFilters } from '@/components/DashboardFilters';
import useAppTheme from '@/hooks/useAppTheme';
import { useModalStore } from '@/state/modalStore';
import { EventsVideoQuickFilter } from './EventsVideoQuickFilter';
import { DASHBOARD_CHROME_SCROLL_KEY, useScrollDirection } from '@/hooks/useScrollDirection';
import { getLegalServicesPath } from '@/utils/legalRoutes';
import { prefetchRoute } from '@/utils/routePrefetcher';

export interface BentoCategoryDashboardProps {
  setCategories: (category: QuickFilterCategory | string) => void;
}

const BENTO_ITEMS = [
  { id: 'property',    label: 'PROPERTIES',          description: 'Find properties to buy or rent', size: 'normal', imageId: 'property',   icon: Home,         delay: '0s' },
  { id: 'events',      label: 'EVENTS LIVE',         description: 'Swipe event videos · tap to open', size: 'big',  imageId: 'events',     icon: Star,         delay: '4s' },
  { id: 'recommended', label: 'RECOMMENDED FOR YOU', description: 'Curated listings',               size: 'normal', imageId: 'events',     icon: Star,         delay: '8s' },
  { id: 'services',    label: 'WORKERS',             description: 'Find people offering services',  size: 'big',    imageId: 'services',   icon: UserCheck,    delay: '12s' },
  { id: 'popular',     label: 'POPULAR',             description: 'Trending now',                   size: 'normal', imageId: 'property',   icon: TrendingUp,   delay: '16s' },
  { id: 'yacht',       label: 'YACHTS',              description: 'Yachts & boats to charter or buy', size: 'big',  imageId: 'yacht',      icon: Anchor,       delay: '20s' },
  { id: 'motorcycle',  label: 'MOTORCYCLES',         description: 'Motorcycles for sale or rent',   size: 'big',    imageId: 'motorcycle', icon: Bike,         delay: '24s' },
  { id: 'bicycle',     label: 'BICYCLES',            description: 'Bicycles for sale or rent',      size: 'normal', imageId: 'bicycle',    icon: Bike,         delay: '28s' },
  { id: 'seekers',     label: 'SEEKERS',             description: 'People looking for workers',     size: 'normal', imageId: 'seekers',    icon: Search,       delay: '32s' },
  { id: 'legal',       label: 'LEGAL SERVICES',      description: 'Hire a top tier lawyer',         size: 'big',    imageId: 'services',   icon: Briefcase,    delay: '36s' },
  { id: 'premium',     label: 'PREMIUM',             description: 'Buy a package & get benefits',   size: 'normal', imageId: 'property',   icon: Star,         delay: '40s' },
] as const;

const SIZE_CLASS: Record<'big' | 'normal', string> = {
  big: 'h-[340px] sm:h-[390px]',
  normal: 'h-[260px] sm:h-[290px]',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.12 } },
};

const columnVariants = {
  hidden: { opacity: 1 },
  show: { opacity: 1 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.12, ease: 'easeOut' } },
};

/** Same Casper fade as SwipessHud — opacity + light drift only, no layout snap. */
const CHROME_SOFT_EASE = [0.25, 0.1, 0.25, 1] as const;
const CHROME_HIDE_MS = 0.34;
const CHROME_SHOW_MS = 0.36;

export const BentoCategoryDashboard = memo(({ setCategories }: BentoCategoryDashboardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { theme, isLight: themeIsLight } = useAppTheme();
  const isLight = themeIsLight || theme === 'light';

  // Same shared scroll chrome as TopBar / bottom dock — hide together on scroll down
  const { isVisible: searchVisible } = useScrollDirection({
    threshold: 36,
    showAtTop: true,
    targetSelector: '#dashboard-scroll-container',
    resetTrigger: location.pathname,
    sharedKey: DASHBOARD_CHROME_SCROLL_KEY,
  });

  const warmDeckForCard = useCallback((id: string) => {
    if (id === 'events') {
      prefetchEventCategoryPhotosImmediate();
      return;
    }
    if (id === 'seekers') {
      prefetchRoute('/explore/seekers');
      return;
    }
    if (id === 'legal') {
      prefetchRoute(getLegalServicesPath('client'));
      return;
    }
    if (id === 'premium') {
      prefetchRoute('/subscription/packages');
      return;
    }
    const target = resolveQuickFilterDeckTarget(id);
    if (!target || !user?.id) return;
    void prefetchQuickFilterDeck(queryClient, user.id, target.category, target.listingType, {
      imageCount: 10,
    });
  }, [queryClient, user?.id]);

  const handleSelect = useCallback((id: string) => {
    triggerHaptic('medium');
    uiSounds.playCategorySelect();
    warmDeckForCard(id);

    if (id === 'premium') navigate('/subscription/packages');
    else if (id === 'events') {
      navigate(EVENTS_FEED_PATH);
    }
    else if (id === 'seekers') navigate('/explore/seekers');
    else if (id === 'legal') navigate(getLegalServicesPath('client'));
    else if (id === 'recommended' || id === 'popular') setCategories('property');
    else if (id === 'pros') setCategories('services');
    else setCategories(id as QuickFilterCategory);
  }, [setCategories, navigate, warmDeckForCard]);

  return (
    <div
      id="dashboard-scroll-container"
      className="dashboard-scroll-target absolute inset-0 w-full h-full px-3 sm:px-4 overflow-y-auto scrollbar-none overscroll-contain scroll-area-momentum"
      style={{
        background: 'var(--dash-bg, hsl(var(--background)))',
        paddingTop: 'calc(var(--top-bar-height, 56px) + var(--safe-top, 0px) + 4px)',
        paddingBottom: 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom) + 16px)',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'auto',
        touchAction: 'pan-y',
      }}
    >
      {/* Ghost fade on scroll — matches header chrome (opacity + soft drift, no snap) */}
      <motion.div
        className="relative z-20 w-full max-w-3xl mx-auto"
        initial={false}
        animate={{
          opacity: searchVisible ? 1 : 0,
          y: searchVisible ? 0 : -8,
        }}
        transition={{
          duration: searchVisible ? CHROME_SHOW_MS : CHROME_HIDE_MS,
          ease: CHROME_SOFT_EASE,
        }}
        style={{
          pointerEvents: searchVisible ? undefined : 'none',
          willChange: 'opacity, transform',
        }}
        aria-hidden={!searchVisible || undefined}
      >
        <div
          className="rounded-[1.2rem] p-1.5 sm:p-2 mb-1.5 overflow-visible"
          style={{
            background: isLight ? 'var(--dash-well, #E8E8EE)' : 'var(--dash-well, #101014)',
          }}
        >
          <AISearchBar
            isLight={isLight}
            onFilterClick={() => useModalStore.getState().openAIChat()}
            onSearchSubmit={(query) => {
              const q = (query || '').trim();
              useModalStore.getState().openAIChat(q);
            }}
          />
          <AIDisclosure isLight={isLight} variant="compact" className="px-1 mt-1" />
          <div className="mt-1">
            <DashboardFilters isLight={isLight} />
          </div>
        </div>
      </motion.div>

      {/* Quick filter well — no outer ink frame */}
      <div
        className={cn(
          'relative z-10 w-full max-w-3xl mx-auto rounded-[1.5rem] p-1.5 sm:p-2',
          isLight ? 'qf-well-glow--light' : 'qf-well-glow--dark',
        )}
        style={{
          background: isLight ? 'var(--dash-well, #E8E8EE)' : 'var(--dash-well, #101014)',
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 w-full flex items-start gap-2 sm:gap-2.5 pb-0.5"
        >
          {[
            BENTO_ITEMS.filter((_, i) => i % 2 === 0),
            BENTO_ITEMS.filter((_, i) => i % 2 === 1),
          ].map((column, colIndex) => (
            <motion.div
              key={colIndex}
              variants={columnVariants}
              className="flex-1 flex flex-col gap-1.5 sm:gap-2.5"
            >
              {column.map((item) => {
                const isEventsLive = item.id === 'events';

                return (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileTap={isEventsLive ? undefined : { opacity: 0.9 }}
                    transition={{ duration: 0.08 }}
                    onClick={isEventsLive ? undefined : () => handleSelect(item.id)}
                    onPointerEnter={isEventsLive ? undefined : () => warmDeckForCard(item.id)}
                    onTouchStart={isEventsLive ? undefined : () => warmDeckForCard(item.id)}
                    onKeyDown={isEventsLive ? undefined : (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(item.id);
                      }
                    }}
                    role={isEventsLive ? undefined : 'button'}
                    tabIndex={isEventsLive ? undefined : 0}
                    aria-label={item.label}
                    data-quick-filter-card
                    data-skip-press-engine
                    className={cn(
                      'force-white relative flex flex-col justify-end text-left overflow-hidden rounded-[2rem] group qf-neo-frame',
                      isLight ? 'qf-neo-frame--light' : 'qf-neo-frame--dark',
                      !isEventsLive && 'cursor-pointer active:scale-[0.98]',
                      SIZE_CLASS[item.size],
                    )}
                    style={{
                      contain: 'paint',
                      touchAction: 'pan-y',
                      background: isLight ? 'var(--dash-elevated, #fff)' : 'var(--dash-elevated, #16161c)',
                    }}
                  >
                    {isEventsLive ? (
                      <EventsVideoQuickFilter className="rounded-[2rem]" />
                    ) : (
                      <>
                        <div className="absolute inset-0">
                          <QuickFilterImage
                            src={POKER_CARD_PHOTOS[item.imageId] || ''}
                            alt={item.label}
                            animationDelay={item.delay}
                            className="object-cover w-full h-full"
                          />
                        </div>

                        <div className="absolute inset-0 z-[11] bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                        <div className="relative z-20 p-2 sm:p-4 w-full">
                          <h3 className="text-white font-black italic uppercase tracking-wider text-sm sm:text-base mb-0.5 drop-shadow-md leading-tight">
                            {item.label}
                          </h3>
                          <p className="text-white/80 font-medium text-[9px] sm:text-[10px] leading-snug tracking-wide drop-shadow">
                            {item.description}
                          </p>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
});

export default BentoCategoryDashboard;

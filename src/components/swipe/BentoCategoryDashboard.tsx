import { memo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import type { QuickFilterCategory } from '@/types/filters';
import { cn } from '@/lib/utils';
import { QuickFilterImage } from '@/components/ui/QuickFilterImage';
import { POKER_CARD_PHOTOS } from './SwipeConstants';
import { EVENTS_FEED_PATH } from '@/constants/eventsRoutes';
import { prefetchEventCategoryPhotosImmediate } from '@/utils/prefetchEventCategoryPhotos';
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

export const BentoCategoryDashboard = memo(({ setCategories }: BentoCategoryDashboardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, isLight: themeIsLight } = useAppTheme();
  const isLight = themeIsLight || theme === 'light';

  // Same shared scroll chrome as header + bottom nav (ONE listener)
  const { isVisible: contextVisible } = useScrollDirection({
    threshold: 28,
    showAtTop: true,
    targetSelector: '.dashboard-scroll-target',
    resetTrigger: location.pathname,
    sharedKey: DASHBOARD_CHROME_SCROLL_KEY,
  });

  const handleSelect = useCallback((id: string) => {
    triggerHaptic('medium');
    uiSounds.playCategorySelect();

    if (id === 'premium') navigate('/subscription/packages');
    else if (id === 'events') {
      prefetchEventCategoryPhotosImmediate();
      navigate(EVENTS_FEED_PATH);
    }
    else if (id === 'recommended' || id === 'popular') setCategories('property');
    else if (id === 'pros') setCategories('services');
    else setCategories(id as QuickFilterCategory);
  }, [setCategories, navigate]);

  return (
    <div
      id="dashboard-scroll-container"
      className="dashboard-scroll-target absolute inset-0 w-full h-full px-4 overflow-y-auto scrollbar-none overscroll-contain scroll-area-momentum"
      style={{
        background: 'var(--dash-bg, hsl(var(--background)))',
        paddingTop: 'calc(var(--top-bar-height, 56px) + var(--safe-top, 0px) + 8px)',
        paddingBottom: 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom) + 24px)',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'auto',
        touchAction: 'pan-y',
      }}
    >
      {/* AI search + date/people/location — soft glass vanish with header/nav */}
      <div
        className={cn(
          'w-full max-w-3xl mx-auto flex flex-col gap-2 items-stretch',
          !contextVisible && 'pointer-events-none',
        )}
        style={{
          opacity: contextVisible ? 1 : 0,
          transform: contextVisible
            ? 'translate3d(0,0,0) scale(1)'
            : 'translate3d(0,-8px,0) scale(0.985)',
          filter: contextVisible ? 'blur(0px)' : 'blur(5px)',
          // Collapse space after the fade so the vanish feels soft, not snappy
          maxHeight: contextVisible ? 220 : 0,
          marginBottom: contextVisible ? 12 : 0,
          overflow: 'hidden',
          willChange: 'opacity, transform, filter, max-height',
          transition: contextVisible
            ? [
                'opacity 0.36s cubic-bezier(0.22, 0.61, 0.36, 1)',
                'transform 0.38s cubic-bezier(0.22, 0.61, 0.36, 1)',
                'filter 0.32s cubic-bezier(0.22, 0.61, 0.36, 1)',
                'max-height 0.28s cubic-bezier(0.22, 0.61, 0.36, 1) 0.06s',
                'margin-bottom 0.28s cubic-bezier(0.22, 0.61, 0.36, 1) 0.06s',
              ].join(', ')
            : [
                'opacity 0.28s cubic-bezier(0.22, 0.61, 0.36, 1)',
                'transform 0.30s cubic-bezier(0.22, 0.61, 0.36, 1)',
                'filter 0.28s cubic-bezier(0.22, 0.61, 0.36, 1)',
                'max-height 0.34s cubic-bezier(0.22, 0.61, 0.36, 1) 0.08s',
                'margin-bottom 0.34s cubic-bezier(0.22, 0.61, 0.36, 1) 0.08s',
              ].join(', '),
        }}
        aria-hidden={!contextVisible || undefined}
      >
        <div
          className="rounded-[1.35rem] p-2.5 sm:p-3"
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
          <AIDisclosure isLight={isLight} variant="compact" className="px-1 mt-1.5" />
          <div className="mt-2">
            <DashboardFilters isLight={isLight} />
          </div>
        </div>
      </div>

      {/* Quick filter well — subtle tonal lift under cards */}
      <div
        className="w-full max-w-3xl mx-auto rounded-[1.75rem] p-2 sm:p-3"
        style={{
          background: isLight ? 'var(--dash-well, #E8E8EE)' : 'var(--dash-well, #101014)',
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full flex items-start gap-3 sm:gap-4 pb-1"
        >
          {[
            BENTO_ITEMS.filter((_, i) => i % 2 === 0),
            BENTO_ITEMS.filter((_, i) => i % 2 === 1),
          ].map((column, colIndex) => (
            <motion.div
              key={colIndex}
              variants={columnVariants}
              className="flex-1 flex flex-col gap-2 sm:gap-4"
            >
              {column.map((item) => {
                const isEventsLive = item.id === 'events';

                return (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileTap={isEventsLive ? undefined : { opacity: 0.88 }}
                    transition={{ duration: 0.08 }}
                    onClick={isEventsLive ? undefined : () => handleSelect(item.id)}
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
                      'force-white relative flex flex-col justify-end text-left overflow-hidden rounded-[2rem] group',
                      !isEventsLive && 'border-t border-white/20 border-l border-white/10 border-r border-white/5 border-b border-black/40 cursor-pointer transition-all duration-500',
                      !isEventsLive && 'shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)] hover:-translate-y-1.5 active:scale-[0.97] hover:z-10',
                      SIZE_CLASS[item.size],
                    )}
                    style={{
                      contain: 'paint',
                      touchAction: isEventsLive ? 'none' : 'pan-y',
                      background: isLight ? 'var(--dash-elevated, #fff)' : 'var(--dash-elevated, #16161c)',
                    }}
                  >
                    {isEventsLive ? (
                      <EventsVideoQuickFilter className="rounded-[2rem] shadow-[0_15px_40px_-10px_rgba(236,72,153,0.35)]" />
                    ) : (
                      <>
                        <div className="absolute inset-0">
                          <QuickFilterImage
                            src={POKER_CARD_PHOTOS[item.imageId] || ''}
                            alt={item.label}
                            animationDelay={item.delay}
                            className="object-cover w-full h-full md:group-hover:scale-[1.03] transition-transform duration-500 ease-out"
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

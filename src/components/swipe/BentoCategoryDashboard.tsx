import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

export interface BentoCategoryDashboardProps {
  setCategories: (category: QuickFilterCategory | string) => void;
}

// Intentionally NON-uniform sizes for a staggered "bento" / masonry look.
// Items alternate into two columns (even indices → left, odd → right).
// Events LIVE sits where Yacht used to be (2nd card, right column, tall).
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
  const { theme } = useAppTheme();
  const isLight = theme === 'light';

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
      className="dashboard-scroll-target absolute inset-0 w-full h-full px-4 bg-transparent overflow-y-auto scrollbar-none overscroll-contain scroll-area-momentum"
      style={{
        paddingTop: 'calc(var(--top-bar-height, 56px) + var(--safe-top, 0px) + 8px)',
        paddingBottom: 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom) + 24px)',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'auto',
        touchAction: 'pan-y',
      }}
    >
      <div className="w-full max-w-3xl mx-auto mb-3 flex flex-col gap-2 items-stretch">
        <AISearchBar
          isLight={isLight}
          onFilterClick={() => useModalStore.getState().openAIChat()}
          onSearchSubmit={(query) => {
            const q = (query || '').trim();
            useModalStore.getState().openAIChat(q);
          }}
        />
        <AIDisclosure isLight={isLight} variant="compact" className="px-1" />
        <div className="flex justify-end">
          <DashboardFilters isLight={isLight} />
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-3xl mx-auto flex items-start gap-3 sm:gap-4 pb-4"
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
                    !isEventsLive && 'border-t border-white/20 border-l border-white/10 border-r border-white/5 border-b border-black/50 cursor-pointer transition-all duration-500',
                    !isEventsLive && 'shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_30px_80px_-15px_rgba(0,0,0,1),0_0_40px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:-translate-y-2 active:scale-[0.97] active:-translate-y-0 active:shadow-md hover:z-10',
                    SIZE_CLASS[item.size],
                  )}
                  style={{ contain: 'paint', touchAction: isEventsLive ? 'none' : 'pan-y' }}
                >
                  {isEventsLive ? (
                    <EventsVideoQuickFilter className="rounded-[2rem] shadow-[0_15px_40px_-10px_rgba(236,72,153,0.45)]" />
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

                      <div
                        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                        style={{
                          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                          backgroundSize: '24px 24px',
                        }}
                      />

                      <div className="absolute -top-12 -right-12 z-0 w-32 h-32 border-[1px] border-white/20 rounded-full opacity-30 pointer-events-none" />
                      <div className="absolute -bottom-8 -left-8 z-0 w-24 h-24 border-[1px] border-white/20 rounded-full opacity-20 pointer-events-none" />

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
  );
});

export default BentoCategoryDashboard;

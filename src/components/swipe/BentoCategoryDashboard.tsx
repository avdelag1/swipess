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
  Bike,
  Calendar,
  Crown,
  Home,
  Key,
  ShoppingCart,
  UserCheck,
  Search,
  Users
} from 'lucide-react';

export interface BentoCategoryDashboardProps {
  setCategories: (category: QuickFilterCategory | string) => void;
}

// Intentionally NON-uniform sizes for a staggered "bento" / masonry look.
// Items alternate into two columns (even indices → left, odd → right). The
// big/normal heights are offset between the columns so the layout feels varied
// and not predictable, while both columns still end at the same height so the
// grid stays balanced (no ragged gap at the bottom).
const BENTO_ITEMS = [
  { id: 'property',   label: 'PROPERTIES',  description: 'Find properties to buy or rent', size: 'big',    imageId: 'property',   icon: Home,         delay: '0s' },
  { id: 'buyers',     label: 'BUYERS',      description: 'People looking to buy',          size: 'normal', imageId: 'buyers',     icon: ShoppingCart, delay: '4s' },
  { id: 'renters',    label: 'TENANTS',     description: 'People looking to rent',         size: 'normal', imageId: 'renters',    icon: Key,          delay: '8s' },
  { id: 'bicycle',    label: 'BICYCLES',    description: 'Bicycles for sale or rent',      size: 'big',    imageId: 'bicycle',    icon: Bike,         delay: '12s' },
  { id: 'services',   label: 'WORKERS',     description: 'Find people offering services',  size: 'big',    imageId: 'services',   icon: UserCheck,    delay: '16s' },
  { id: 'motorcycle', label: 'MOTORCYCLES', description: 'Motorcycles for sale or rent',   size: 'normal', imageId: 'motorcycle', icon: Bike,         delay: '20s' },
  { id: 'seekers',    label: 'SEEKERS',     description: 'People looking for workers',     size: 'normal', imageId: 'seekers',    icon: Search,       delay: '24s' },
  { id: 'roommates',  label: 'ROOMMATES',   description: 'Find your perfect roommate',     size: 'big',    imageId: 'roommates',  icon: Users,        delay: '28s' },
  { id: 'premium',    label: 'PREMIUM',     description: 'Unlock exclusive features',      size: 'normal', imageId: 'premium',    icon: Crown,        delay: '32s' },
  { id: 'events',     label: 'EVENTS',      description: 'Discover local events',          size: 'big',    imageId: 'events',     icon: Calendar,     delay: '36s' },
] as const;

// Two height tiers. "big" is noticeably taller than "normal" so the staggered
// columns produce the deliberate size mismatch.
const SIZE_CLASS: Record<'big' | 'normal', string> = {
  big: 'h-[340px] sm:h-[390px]',
  normal: 'h-[260px] sm:h-[290px]',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.02 }
  }
};

const columnVariants = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 450, damping: 30 } }
};

export const BentoCategoryDashboard = memo(({ setCategories }: BentoCategoryDashboardProps) => {
  const navigate = useNavigate();

  const handleSelect = useCallback((id: string) => {
    triggerHaptic('medium');
    uiSounds.playCategorySelect();
    
    if (id === 'premium') navigate('/subscription/packages');
    else if (id === 'events') {
      prefetchEventCategoryPhotosImmediate();
      navigate(EVENTS_FEED_PATH);
    }
    else setCategories(id as QuickFilterCategory);
  }, [setCategories, navigate]);

  return (
    <div
      className="absolute inset-0 w-full h-full px-2 bg-transparent overflow-y-auto scrollbar-none overscroll-contain scroll-area-momentum"
      style={{
        paddingTop: 'calc(var(--top-bar-height, 64px) + var(--safe-top, 0px) + 8px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'auto',
        touchAction: 'pan-y',
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-3xl mx-auto flex items-start gap-2 sm:gap-4 pb-4"
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
            {column.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSelect(item.id)}
                className={cn(
                  "force-white relative flex flex-col justify-end text-left overflow-hidden rounded-2xl shadow-lg border border-white/10 group cursor-pointer transition-transform duration-700",
                  SIZE_CLASS[item.size]
                )}
                style={{ contain: 'paint', touchAction: 'pan-y' }}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <QuickFilterImage
                    src={POKER_CARD_PHOTOS[item.imageId] || ''}
                    alt={item.label}
                    animationDelay={item.delay}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                </div>

                {/* Soft gradient from bottom for text readability without obscuring photo */}
                <div className="absolute inset-0 z-[11] bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Abstract decorative elements (dots & circles like the mockup) */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                     style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                <div className="absolute -top-12 -right-12 z-0 w-32 h-32 border-[1px] border-white/20 rounded-full opacity-30 pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 z-0 w-24 h-24 border-[1px] border-white/20 rounded-full opacity-20 pointer-events-none" />

                {/* Content Text */}
                <div className="relative z-20 p-2 sm:p-4 w-full">
                  <h3 className="text-white font-black italic uppercase tracking-wider text-sm sm:text-base mb-0.5 drop-shadow-md leading-tight">
                    {item.label}
                  </h3>
                  <p className="text-white/80 font-medium text-[9px] sm:text-[10px] leading-snug tracking-wide drop-shadow">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
});

export default BentoCategoryDashboard;

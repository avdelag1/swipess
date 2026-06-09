import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import type { QuickFilterCategory } from '@/types/filters';
import { cn } from '@/lib/utils';
import { QuickFilterImage } from '@/components/ui/QuickFilterImage';
import { POKER_CARD_PHOTOS } from './SwipeConstants';
import {
  Home,
  UserCheck,
  Bike,
  Calendar,
  ShoppingCart,
  Key,
  Search
} from 'lucide-react';

export interface BentoCategoryDashboardProps {
  setCategories: (category: QuickFilterCategory | string) => void;
}

const BENTO_ITEMS = [
  // --- GROUP 1: Properties (big left) + Buyers & Tenants (small right) ---
  // Grid auto-placement: property fills rows 1-2 col 1-2; buyers→row1 col3-4; tenants→row2 col3-4
  {
    id: 'property',
    label: 'PROPERTIES',
    description: 'Find properties to buy or rent',
    className: 'col-span-2 row-span-2',
    imageId: 'property',
    icon: Home,
    delay: '0s'
  },
  {
    id: 'buyers',
    label: 'BUYERS',
    description: 'People looking to buy',
    className: 'col-span-2 row-span-1',
    imageId: 'buyers',
    icon: ShoppingCart,
    delay: '4s'
  },
  {
    id: 'rentals',
    label: 'TENANTS',
    description: 'People looking to rent',
    className: 'col-span-2 row-span-1',
    imageId: 'renters',
    icon: Key,
    delay: '8s'
  },

  // --- GROUP 2: Bicycles (small left) + Workers (big right) + Motorcycles (small left) ---
  // bicycle→row3 col1-2; services(2×2)→rows3-4 col3-4; motorcycle→row4 col1-2
  {
    id: 'bicycle',
    label: 'BICYCLES',
    description: 'Bicycles for sale or rent',
    className: 'col-span-2 row-span-1',
    imageId: 'bicycle',
    icon: Bike,
    delay: '12s'
  },
  {
    id: 'services',
    label: 'WORKERS',
    description: 'Find people offering services',
    className: 'col-span-2 row-span-2',
    imageId: 'services',
    icon: UserCheck,
    delay: '16s'
  },
  {
    id: 'motorcycle',
    label: 'MOTORCYCLES',
    description: 'Motorcycles for sale or rent',
    className: 'col-span-2 row-span-1',
    imageId: 'motorcycle',
    icon: Bike,
    delay: '20s'
  },

  // --- GROUP 3: Seekers (left) + Events (right) ---
  {
    id: 'seekers',
    label: 'SEEKERS',
    description: 'People looking for help',
    className: 'col-span-2 row-span-1',
    imageId: 'seekers',
    icon: Search,
    delay: '24s'
  },
  {
    id: 'events',
    label: 'EVENTS',
    description: 'Discover local events',
    className: 'col-span-2 row-span-1',
    imageId: 'events',
    icon: Calendar,
    delay: '28s'
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.02, delayChildren: 0.02 }
  }
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
    
    if (id === 'events') navigate('/explore/events');
    else if (id === 'seekers') navigate('/explore/seekers');
    else if (id === 'lawyer' || id === 'legal') navigate('/legal-services');
    else setCategories(id as QuickFilterCategory);
  }, [setCategories, navigate]);

  return (
    <div 
      className="absolute inset-0 w-full h-full px-2 bg-transparent overflow-hidden"
      style={{
        paddingTop: 'calc(var(--top-bar-height, 64px) + var(--safe-top, 0px) + 8px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)'
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full h-full max-w-3xl mx-auto grid grid-cols-4 gap-2 sm:gap-4 grid-rows-[repeat(5,minmax(0,1fr))]"
      >
        {BENTO_ITEMS.map((item) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(item.id)}
            className={cn(
              "relative flex flex-col justify-end text-left overflow-hidden rounded-2xl shadow-lg border border-white/10 group cursor-pointer",
              item.className
            )}
            style={{ contain: 'paint' }}
          >
            {/* Background Image — no z-0 so QuickFilterImage's drag overlay (z-20) participates in the card's stacking context and receives pointer events */}
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

            {/* Content Icon Removed */}

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
    </div>
  );
});

export default BentoCategoryDashboard;

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
  Users, 
  Briefcase 
} from 'lucide-react';

export interface BentoCategoryDashboardProps {
  setCategories: (category: QuickFilterCategory | string) => void;
}

const BENTO_ITEMS = [
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
    id: 'bicycle',
    label: 'BICYCLES',
    description: 'Find bicycles for sale or rent',
    className: 'col-span-2 row-span-1',
    imageId: 'bicycle',
    icon: Bike,
    delay: '4s'
  },
  {
    id: 'buyers',
    label: 'BUYERS',
    description: 'Find people looking to buy',
    className: 'col-span-2 row-span-1',
    imageId: 'buyers',
    icon: ShoppingCart,
    delay: '8s'
  },
  {
    id: 'services',
    label: 'WORKERS',
    description: 'Find people offering services',
    className: 'col-span-2 row-span-1',
    imageId: 'services',
    icon: UserCheck,
    delay: '12s'
  },
  {
    id: 'motorcycle',
    label: 'MOTORCYCLES',
    description: 'Find motorcycles for sale or rent',
    className: 'col-span-1 row-span-1',
    imageId: 'motorcycle',
    icon: Bike,
    delay: '16s'
  },
  {
    id: 'events',
    label: 'EVENTS',
    description: 'Discover local events',
    className: 'col-span-1 row-span-1',
    imageId: 'events',
    icon: Calendar,
    delay: '20s'
  },
  {
    id: 'leads',
    label: 'SEEKERS',
    description: 'People looking to hire',
    className: 'col-span-2 row-span-1',
    imageId: 'leads',
    icon: Briefcase,
    delay: '24s'
  },
  {
    id: 'rentals',
    label: 'RENTERS',
    description: 'Find people looking to rent',
    className: 'col-span-2 row-span-1',
    imageId: 'renters',
    icon: Key,
    delay: '28s'
  },
  {
    id: 'roommates',
    label: 'ROOMMATES',
    description: 'Find roommates',
    className: 'col-span-2 row-span-1',
    imageId: 'renters', 
    icon: Users,
    delay: '32s'
  },
  {
    id: 'lawyer',
    label: 'LEGAL',
    description: 'Legal Hub & Docs',
    className: 'col-span-2 row-span-1',
    imageId: 'lawyer',
    icon: Users,
    delay: '36s'
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
    else if (id === 'roommates') navigate('/roommate-matching');
    else if (id === 'lawyer') navigate('/client/legal-services');
    else setCategories(id as QuickFilterCategory);
  }, [setCategories, navigate]);

  return (
    <div 
      className="absolute inset-x-2 bottom-[88px] overflow-hidden bg-transparent"
      style={{ top: 'calc(var(--top-bar-height, 64px) + 2px)' }}
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
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
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

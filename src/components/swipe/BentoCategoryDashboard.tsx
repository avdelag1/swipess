import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import type { QuickFilterCategory } from '@/types/filters';
import { cn } from '@/lib/utils';
import { QuickFilterImage } from '@/components/ui/QuickFilterImage';
import { POKER_CARD_PHOTOS } from './SwipeConstants';

export interface BentoCategoryDashboardProps {
  setCategories: (category: QuickFilterCategory | string) => void;
}

const BENTO_ITEMS = [
  {
    id: 'property',
    label: 'PROPERTIES',
    description: 'Buy, rent or sell properties',
    className: 'col-span-2 md:col-span-3 row-span-2',
    gradient: 'from-[#FF4D00]/90 to-[#FF8C00]/90',
    imageId: 'property',
  },
  {
    id: 'buyers',
    label: 'BUYERS',
    description: 'Find buyers for anything',
    className: 'col-span-1 md:col-span-3 row-span-1',
    gradient: 'from-[#10b981]/90 to-[#047857]/90',
    imageId: 'buyers',
  },
  {
    id: 'rentals',
    label: 'RENTALS',
    description: 'Find rental opportunities',
    className: 'col-span-1 md:col-span-3 row-span-1',
    gradient: 'from-[#0ea5e9]/90 to-[#0369a1]/90',
    imageId: 'renters',
  },
  {
    id: 'motorcycle',
    label: 'MOTORCYCLES',
    description: 'Buy or sell motorcycles',
    className: 'col-span-1 md:col-span-2 row-span-1',
    gradient: 'from-[#e11d48]/90 to-[#9f1239]/90',
    imageId: 'motorcycle',
  },
  {
    id: 'bicycle',
    label: 'BICYCLES',
    description: 'Buy or sell bicycles',
    className: 'col-span-1 md:col-span-2 row-span-1',
    gradient: 'from-[#0d9488]/90 to-[#0f766e]/90',
    imageId: 'bicycle',
  },
  {
    id: 'services',
    label: 'WORKERS',
    description: 'Find or hire workers',
    className: 'col-span-2 md:col-span-2 row-span-2',
    gradient: 'from-[#7c3aed]/90 to-[#4c1d95]/90',
    imageId: 'services',
  },
  {
    id: 'roommates',
    label: 'ROOMMATES',
    description: 'Find a roommate or a room',
    className: 'col-span-1 md:col-span-2 row-span-1',
    gradient: 'from-[#6366f1]/90 to-[#4338ca]/90',
    imageId: 'renters', // Fallback to renters photo if roommates doesn't exist
  },
  {
    id: 'leads',
    label: 'LOOKING FOR',
    description: 'Find help or something specific',
    className: 'col-span-1 md:col-span-2 row-span-1',
    gradient: 'from-[#f59e0b]/90 to-[#d97706]/90',
    imageId: 'leads',
  },
  {
    id: 'events',
    label: 'EVENTS',
    description: 'Discover & promote events',
    className: 'col-span-2 md:col-span-2 row-span-1',
    gradient: 'from-[#ec4899]/90 to-[#be185d]/90',
    imageId: 'events',
  },
  {
    id: 'promote',
    label: 'PROMOTE EVENT',
    description: 'Promote & manage your events',
    className: 'col-span-1 md:col-span-2 row-span-1',
    gradient: 'from-[#e11d48]/90 to-[#be123c]/90',
    imageId: 'promote',
  },
  {
    id: 'lawyer',
    label: 'LEGAL SERVICES',
    description: 'Legal services & consultations',
    className: 'col-span-1 md:col-span-2 row-span-1',
    gradient: 'from-[#3b82f6]/90 to-[#1d4ed8]/90',
    imageId: 'lawyer',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 25 } }
};

export const BentoCategoryDashboard = memo(({ setCategories }: BentoCategoryDashboardProps) => {
  const navigate = useNavigate();

  const handleSelect = useCallback((id: string) => {
    triggerHaptic('medium');
    uiSounds.playCategorySelect();
    
    if (id === 'events') navigate('/explore/events');
    else if (id === 'promote') navigate('/promote-event');
    else if (id === 'lawyer') navigate('/client/legal-services');
    else if (id === 'roommates') navigate('/roommate-matching');
    else setCategories(id as QuickFilterCategory);
  }, [setCategories, navigate]);

  return (
    <div 
      className="absolute inset-x-4 bottom-[88px] overflow-hidden bg-transparent"
      style={{ top: 'calc(var(--top-bar-height, 72px) + 16px)' }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full h-full max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4 grid-rows-[repeat(9,minmax(0,1fr))] md:grid-rows-[repeat(5,minmax(0,1fr))]"
      >
        {BENTO_ITEMS.map((item) => (
          <motion.button
            key={item.id}
            variants={itemVariants}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(item.id)}
            className={cn(
              "relative flex flex-col justify-end text-left overflow-hidden rounded-2xl shadow-lg border border-white/10 group",
              item.className
            )}
            style={{ contain: 'paint' }}
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <QuickFilterImage src={POKER_CARD_PHOTOS[item.imageId] || ''} alt={item.label} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out" />
            </div>

            {/* Soft gradient from bottom for text readability without obscuring photo */}
            <div className="absolute inset-0 z-[11] bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Abstract decorative elements (dots & circles like the mockup) */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            
            <div className="absolute -top-12 -right-12 z-0 w-32 h-32 border-[1px] border-white/20 rounded-full opacity-30 pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 z-0 w-24 h-24 border-[1px] border-white/20 rounded-full opacity-20 pointer-events-none" />

            {/* Content */}
            <div className="relative z-20 p-4 w-full">
              <h3 className="text-white font-black italic uppercase tracking-wider text-base sm:text-lg mb-0.5 drop-shadow-md leading-tight">
                {item.label}
              </h3>
              <p className="text-white/80 font-medium text-[10px] sm:text-xs leading-snug tracking-wide drop-shadow">
                {item.description}
              </p>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
});

export default BentoCategoryDashboard;

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import { useModalStore } from '@/state/modalStore';
import { useFilterStore } from '@/state/filterStore';
import { POKER_CARD_PHOTOS } from './SwipeConstants';
import type { QuickFilterCategory } from '@/types/filters';

export interface BentoCategoryGridProps {
  setCategories: (category: QuickFilterCategory) => void;
}

export const BentoCategoryGrid = ({ setCategories }: BentoCategoryGridProps) => {
  const navigate = useNavigate();
  const openAIListing = useModalStore((s) => s.openAIListing);

  const handleSelect = useCallback(
    (id: string) => {
      triggerHaptic('medium');
      uiSounds.playCategorySelect();

      if (id === 'events') {
        navigate('/explore/events');
      } else if (id === 'legal' || id === 'lawyer') {
        navigate('/legal');
      } else if (id === 'promote') {
        navigate('/client/advertise');
      } else if (id === 'vap') {
        useModalStore.getState().setModal('showVapId', true);
      } else {
        setCategories(id as QuickFilterCategory);
      }
    },
    [setCategories, navigate]
  );

  // Exact DOM order mapping to the user's uploaded mock image
  // 3 Columns Grid
  const BENTO_CARDS = [
    {
      id: 'property',
      label: 'PROPERTIES',
      sublabel: 'Buy, rent or\nsell properties',
      colSpan: 'col-span-2',
      rowSpan: 'row-span-2',
      gradient: 'from-[#ff512f] to-[#dd2476]', // Vibrant Orange/Red
      photo: POKER_CARD_PHOTOS['property'] || '/images/filters/property.jpg',
    },
    {
      id: 'buyers',
      label: 'BUYERS',
      sublabel: 'Find buyers for\nanything',
      colSpan: 'col-span-1',
      rowSpan: 'row-span-1',
      gradient: 'from-[#11998e] to-[#38ef7d]', // Green
      photo: POKER_CARD_PHOTOS['buyers'] || '/images/filters/owner_buyers_card.jpg',
    },
    {
      id: 'renters',
      label: 'RENTALS',
      sublabel: 'Find rental\nopportunities',
      colSpan: 'col-span-1',
      rowSpan: 'row-span-1',
      gradient: 'from-[#00b4db] to-[#0083b0]', // Blue
      photo: POKER_CARD_PHOTOS['renters'] || '/images/filters/owner_renters_card.jpg',
    },
    {
      id: 'motorcycle',
      label: 'MOTORCYCLES',
      sublabel: 'Buy or sell\nmotorcycles',
      colSpan: 'col-span-1',
      rowSpan: 'row-span-1',
      gradient: 'from-[#e52d27] to-[#b31217]', // Deep Red/Pink
      photo: POKER_CARD_PHOTOS['motorcycle'] || '/images/filters/scooter.jpg',
    },
    {
      id: 'bicycle',
      label: 'BICYCLES',
      sublabel: 'Buy or sell\nbicycles',
      colSpan: 'col-span-1',
      rowSpan: 'row-span-1',
      gradient: 'from-[#1d976c] to-[#93f9b9]', // Teal
      photo: POKER_CARD_PHOTOS['bicycle'] || '/images/filters/bicycle.jpg',
    },
    {
      id: 'services',
      label: 'WORKERS',
      sublabel: 'Find or hire\nworkers',
      colSpan: 'col-span-1',
      rowSpan: 'row-span-2',
      gradient: 'from-[#654ea3] to-[#eaafc8]', // Purple
      photo: POKER_CARD_PHOTOS['services'] || '/images/filters/workers.jpg',
    },
    {
      id: 'roommates',
      label: 'ROOMMATES',
      sublabel: 'Find a roommate\nor a room',
      colSpan: 'col-span-1',
      rowSpan: 'row-span-1',
      gradient: 'from-[#8e2de2] to-[#4a00e0]', // Deep Purple
      photo: POKER_CARD_PHOTOS['property'] || '/images/filters/property.jpg',
    },
    {
      id: 'leads',
      label: 'LOOKING FOR',
      sublabel: 'Find help or\nsomething specific',
      colSpan: 'col-span-1',
      rowSpan: 'row-span-1',
      gradient: 'from-[#f2994a] to-[#f2c94c]', // Orange/Yellow
      photo: POKER_CARD_PHOTOS['leads'] || '/images/filters/owner_hire_card.jpg',
    },
    {
      id: 'events',
      label: 'EVENTS',
      sublabel: 'Discover & promote\nevents',
      colSpan: 'col-span-1',
      rowSpan: 'row-span-1',
      gradient: 'from-[#da22ff] to-[#9733ee]', // Magenta
      photo: POKER_CARD_PHOTOS['events'] || '/images/filters/events_card.jpg',
    },
    {
      id: 'promote',
      label: 'PROMOTE EVENT',
      sublabel: 'Promote & manage\nyour events',
      colSpan: 'col-span-1',
      rowSpan: 'row-span-1',
      gradient: 'from-[#f85032] to-[#e73827]', // Strong Red/Pink
      photo: POKER_CARD_PHOTOS['promote'] || '/images/filters/owner_promote_card.jpg',
    },
    {
      id: 'lawyer',
      label: 'LEGAL SERVICES',
      sublabel: 'Legal services &\nconsultations',
      colSpan: 'col-span-1',
      rowSpan: 'row-span-1',
      gradient: 'from-[#1e3c72] to-[#2a5298]', // Deep Blue
      photo: POKER_CARD_PHOTOS['lawyer'] || '/images/filters/owner_lawyer_card.jpg',
    },
  ];

  return (
    <div
      className="relative w-full h-full overflow-y-auto overflow-x-hidden bg-black px-4 py-6"
      style={{
        paddingTop: 'var(--top-bar-height, 72px)',
        paddingBottom: 'calc(var(--bottom-nav-height, 80px) + 24px)',
      }}
    >
      <div className="grid grid-cols-3 gap-3 auto-rows-[120px] max-w-[600px] mx-auto w-full pb-10">
        {BENTO_CARDS.map((card, idx) => (
          <motion.button
            key={card.id}
            onClick={() => handleSelect(card.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'relative rounded-[24px] overflow-hidden text-left flex flex-col justify-end p-4 border border-white/10 shadow-xl transition-shadow',
              card.colSpan,
              card.rowSpan
            )}
            style={{
              // Fallback background before image loads
              background: `linear-gradient(135deg, ${card.gradient.split(' ')[1].replace('to-[', '').replace(']', '')}, ${card.gradient.split(' ')[0].replace('from-[', '').replace(']', '')})`,
            }}
          >
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
              <img
                src={card.photo}
                alt={card.label}
                className="w-full h-full object-cover mix-blend-overlay opacity-60"
                loading="lazy"
              />
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", card.gradient)} />
              
              {/* Abstract Dot Pattern (matching the mockup) */}
              <div className="absolute top-4 left-4 w-12 h-12 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2.5px)', backgroundSize: '10px 10px' }} />
              {/* Optional Curve Pattern (matching the mockup) */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full border border-white/20 opacity-30 pointer-events-none" />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full border border-white/20 opacity-30 pointer-events-none" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 w-full">
              <h3 className={cn(
                "font-black text-white italic tracking-wide leading-tight",
                card.colSpan === 'col-span-2' ? 'text-3xl mb-2' : 'text-[15px] mb-1'
              )} style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                {card.label}
              </h3>
              <p className={cn(
                "text-white/90 font-medium whitespace-pre-line leading-tight",
                card.colSpan === 'col-span-2' ? 'text-base' : 'text-[11px]'
              )} style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                {card.sublabel}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default BentoCategoryGrid;

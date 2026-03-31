import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { POKER_CARDS, POKER_CARD_PHOTOS, POKER_CARD_GRADIENTS } from './SwipeConstants';
import { cn } from '@/lib/utils';
import { Sparkles, ArrowUpRight } from 'lucide-react';

export interface SwipeAllDashboardProps {
  setCategories: (ids: any[]) => void;
}

/**
 * SwipeAllDashboard - High-Performance Tile Grid
 * Replaced the "game-like" poker cards with a premium, stone-cold fast grid of 
 * high-fidelity category tiles. Optimized for zero interaction latency.
 */
export const SwipeAllDashboard = memo(({ setCategories }: SwipeAllDashboardProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    triggerHaptic('medium');
    setCategories([id === 'all' ? 'property' : id]); // Map 'all' to property or handle as needed
  };

  return (
    <div className="relative w-full min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Dynamic Background Glow */}
      <AnimatePresence>
        {hoveredId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none -z-10 blur-[120px]"
            style={{ 
              backgroundColor: POKER_CARDS.find(c => c.id === hoveredId)?.accent || '#3b82f6'
            }}
          />
        )}
      </AnimatePresence>

      <div className="w-full max-w-lg space-y-8 z-10">
        <div className="text-center space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Discover Tulum</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="text-4xl font-black text-foreground italic tracking-tighter uppercase"
          >
            CHOOSE YOUR <span className="text-primary tracking-normal not-italic">VIBE</span>
          </motion.h2>
        </div>

        {/* 2x2 Grid + Large "All" bottom tile */}
        <div className="grid grid-cols-2 gap-4">
          {POKER_CARDS.filter(c => c.id !== 'all').map((card, idx) => (
            <CategoryTile 
              key={card.id}
              card={card}
              delay={0.2 + idx * 0.05}
              onMouseEnter={() => setHoveredId(card.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleSelect(card.id)}
            />
          ))}
          
          <div className="col-span-2 mt-4">
            {POKER_CARDS.filter(c => c.id === 'all').map((card) => (
              <CategoryTile 
                key={card.id}
                card={card}
                delay={0.4}
                isFullWidth
                onMouseEnter={() => setHoveredId(card.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleSelect(card.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Subtle bottom noise / pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
    </div>
  );
});

const CategoryTile = ({ card, delay, onMouseEnter, onMouseLeave, onClick, isFullWidth }: any) => {
  const photo = POKER_CARD_PHOTOS[card.id];
  const gradient = POKER_CARD_GRADIENTS[card.id];

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1, transition: { delay } }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={cn(
        "relative group overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-white/5",
        isFullWidth ? "h-32" : "h-48"
      )}
    >
      {/* Background Image / Gradient */}
      <div className="absolute inset-0">
        <img 
          src={photo} 
          alt={card.label}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
        />
        <div 
          className="absolute inset-0 transition-opacity duration-500 opacity-40 group-hover:opacity-20"
          style={{ background: gradient }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-x-5 bottom-5 flex items-end justify-between">
        <div className="text-left">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/50 mb-0.5 group-hover:text-primary transition-colors">
            {card.description}
          </p>
          <h3 className="text-xl font-black text-white italic tracking-tight uppercase leading-none group-hover:translate-x-1 transition-transform">
            {card.label}
          </h3>
        </div>
        
        <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <ArrowUpRight className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Shine Effect on hover */}
      <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
    </motion.button>
  );
};

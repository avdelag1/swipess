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
    // 'all' should clear specific categories to show everything
    const categories = id === 'all' ? [] : [id];
    setCategories(categories);
    
    // Explicitly notify any parent components that the user has chosen a specific vibe
    // This choice is automatically persisted by the underlying FilterStore
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
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
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
          
          <div className="col-span-2 mt-2">
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

const CategoryTile = memo(({ card, delay, onMouseEnter, onMouseLeave, onClick, isFullWidth }: any) => {
  const photo = POKER_CARD_PHOTOS[card.id];
  const gradient = POKER_CARD_GRADIENTS[card.id];

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1, transition: { delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
      whileTap={{ scale: 0.98 }}
      onPointerEnter={onMouseEnter}
      onPointerLeave={onMouseLeave}
      onClick={onClick}
      className={cn(
        "relative group overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-white/5 shadow-2xl",
        isFullWidth ? "h-32" : "h-48"
      )}
    >
      {/* Background Image with Breathing Zoom Effect */}
      <div className="absolute inset-0">
        <motion.img 
          src={photo} 
          alt={card.label}
          initial={{ scale: 1.05 }}
          animate={{ 
            scale: [1, 1.06, 1], // The "Breathing" zoom effect
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115 opacity-70 group-hover:opacity-100 will-change-transform"
        />
        <div 
          className="absolute inset-0 transition-opacity duration-500 opacity-30 group-hover:opacity-10"
          style={{ background: gradient }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-x-5 bottom-5 flex items-end justify-between z-10">
        <div className="text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 group-hover:text-primary transition-colors">
            {card.description}
          </p>
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none group-hover:translate-x-1 transition-transform">
            {card.label}
          </h3>
        </div>
        
        <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <ArrowUpRight className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Interactive Shine Layer */}
      <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
    </motion.button>
  );
});


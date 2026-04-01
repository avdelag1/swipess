import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/microPolish';
import { ChevronDown, ArrowUp } from 'lucide-react';

interface DiscoveryReelProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  headerContent?: React.ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
}

/**
 * DISCOVERY REEL — Instagram/TikTok style vertical snap-scrolling interface.
 * Features:
 * - High-fidelity vertical snap-scroll (100dvh per card)
 * - Seamless integration of the 'Premiums Dashboard' as the first slide
 * - Tactile feedback on snap transitions
 * - Dynamic scroll indicators
 */
export const DiscoveryReel: React.FC<DiscoveryReelProps> = ({
  items,
  renderItem,
  headerContent,
  onRefresh,
  isLoading
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({ container: containerRef });
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const newIndex = Math.round(scrollTop / clientHeight);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      triggerHaptic('light'); // Native feel on snap
    }
  }, [activeIndex]);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    triggerHaptic('medium');
  };

  const scrollToNext = () => {
    if (containerRef.current) {
      const nextY = (activeIndex + 1) * containerRef.current.clientHeight;
      containerRef.current.scrollTo({ top: nextY, behavior: 'smooth' });
      triggerHaptic('light');
    }
  };

  return (
    <div className="relative w-full h-[calc(100dvh-120px)] overflow-hidden bg-[#050505] rounded-3xl shadow-3xl">
      {/* Progress Bar (Glow mode) */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Snap Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar"
        style={{ overscrollBehavior: 'none' }}
      >
        {/* Slide 0: The Dashboard / Header Content */}
        {headerContent && (
          <div className="w-full h-full snap-start snap-always shrink-0 relative flex flex-col items-center justify-center p-4">
            {headerContent}
            
            {/* "Swipe Up" Cue */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
              className="absolute bottom-8 flex flex-col items-center gap-2 text-white/40 font-black uppercase tracking-[0.2em] text-[10px]"
              onClick={scrollToNext}
            >
              <span>Explore Listings</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </motion.div>
          </div>
        )}

        {/* Dynamic Slides: The Listings/Profiles */}
        {items.map((item, index) => (
          <div 
            key={item.id || index}
            className="w-full h-full snap-start snap-always shrink-0 flex items-center justify-center relative bg-[#0a0a0b]"
          >
            {renderItem(item, index)}
          </div>
        ))}

        {/* Loading / Refresh State */}
        {onRefresh && (
          <div className="w-full h-32 snap-end flex items-center justify-center py-12">
             <button 
               onClick={onRefresh}
               className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
             >
               {isLoading ? 'Loading More...' : 'Refresh Feed'}
             </button>
          </div>
        )}
      </div>

      {/* Persistent Return Button (Only visible when scrolled down) */}
      <AnimatePresence>
        {activeIndex > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="absolute bottom-6 right-6 z-[60] w-12 h-12 rounded-full bg-card/60 backdrop-blur-xl border border-border flex items-center justify-center text-foreground shadow-2xl"
            aria-label="Return to Dashboard"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

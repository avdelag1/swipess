import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { SwipessLogo } from './SwipessLogo';
import { triggerHaptic } from '@/utils/haptics';

interface MainLogoPageProps {
  onEnter: () => void;
}

export const MainLogoPage = memo(({ onEnter }: MainLogoPageProps) => {
  const handleAction = () => {
    triggerHaptic('medium');
    onEnter();
  };

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50 cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleAction}
    >
      <div className="relative group">
        {/* Cinematic Glow Effect */}
        <div className="absolute inset-0 -inset-x-20 bg-primary/10 blur-[120px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <SwipessLogo 
            size="4xl" 
            variant="white"
            className="w-[90vw] max-w-[400px] sm:max-w-[500px] drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]" 
          />
          
          {/* Scanning Line Effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
              width: '2px',
              height: '100%',
              left: 0
            }}
            animate={{ left: ['-10%', '110%'] }}
            transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 4 }}
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="mt-24 flex flex-col items-center gap-4"
      >
        <motion.p
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40 italic"
        >
          Tap to Protocol
        </motion.p>
        
        <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
      </motion.div>
    </motion.div>
  );
});

MainLogoPage.displayName = 'MainLogoPage';

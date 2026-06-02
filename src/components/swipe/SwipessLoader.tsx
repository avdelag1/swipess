import { motion } from 'framer-motion';
import { SwipessLogo } from '@/components/SwipessLogo';

export function SwipessLoader() {
  return (
    <motion.div
      key="swipess-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative w-full h-full flex-1 max-w-lg mx-auto flex flex-col items-center justify-center rounded-[32px] overflow-hidden"
    >
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="animate-glow-breathe">
          <SwipessLogo variant="white" size="md" />
        </div>
        <motion.p
          className="text-white/30 text-[11px] font-light tracking-wider"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          Finding what fits
        </motion.p>
      </div>
    </motion.div>
  );
}

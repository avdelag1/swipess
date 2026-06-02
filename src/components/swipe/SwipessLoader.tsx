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
      className="relative w-full h-full flex-1 max-w-lg mx-auto flex flex-col items-center justify-center bg-[#050505] rounded-[32px] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 opacity-60" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="animate-glow-breathe">
          <SwipessLogo variant="white" size="5xl" />
        </div>
        <motion.p
          className="text-white/40 text-sm font-light tracking-wide"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          Finding what fits
        </motion.p>
      </div>
    </motion.div>
  );
}

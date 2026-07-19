import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * GESTURE HINTS
 * First-run overlay showing left/right swipe affordances.
 * Fades in after 600ms, fades out when hidden (e.g. user starts dragging).
 */
export function GestureHints({ hidden = false }: { hidden?: boolean }) {
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="gesture-hints"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="absolute inset-0 pointer-events-none z-20 flex items-end justify-between px-5"
          style={{ bottom: '30%' }}
        >
          {/* Pass — swipe left */}
          <motion.div
            animate={{ x: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', repeatDelay: 1 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Pass</span>
          </motion.div>

          {/* Like — swipe right */}
          <motion.div
            animate={{ x: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', repeatDelay: 1 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <ArrowRight className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Like</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

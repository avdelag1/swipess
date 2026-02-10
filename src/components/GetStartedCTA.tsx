import { motion } from 'framer-motion';
import { Plus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GetStartedCTAProps {
  onClick: () => void;
  visible?: boolean;
}

/**
 * Get Started CTA shown on the main swipe page for new users
 * Appears as a subtle but clear call-to-action
 */
export function GetStartedCTA({ onClick, visible = true }: GetStartedCTAProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-14 left-0 right-0 z-20 flex justify-center pointer-events-none"
    >
      <motion.button
        onClick={onClick}
        className={cn(
          'pointer-events-auto',
          'flex items-center gap-2 px-4 py-2 rounded-full',
          'bg-white/10 backdrop-blur-md border border-white/20',
          'hover:bg-white/20 hover:border-white/30',
          'transition-all duration-150',
          'active:scale-[0.98]'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="w-4 h-4 text-white" />
        <span className="text-sm font-medium text-white">Get Started</span>
        <ArrowRight className="w-4 h-4 text-white/70" />
      </motion.button>
    </motion.div>
  );
}

export default GetStartedCTA;

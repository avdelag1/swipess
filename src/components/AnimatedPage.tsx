import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="h-full w-full"
      initial={{ opacity: 0.85 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'tween', duration: 0.1, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

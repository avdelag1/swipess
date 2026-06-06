import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="h-full w-full"
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.7 }}
    >
      {children}
    </motion.div>
  );
}

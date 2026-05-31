import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="h-full w-full"
      initial={{ opacity: 0.6, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, mass: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

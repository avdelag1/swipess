import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="h-full w-full"
      initial={{ opacity: 0.8, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25, mass: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

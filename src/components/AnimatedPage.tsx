import { ReactNode } from 'react';
import { motion } from 'framer-motion';

// Match AnimatedOutlet speed so standalone pages feel consistent
export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.14, ease: [0, 0, 0.2, 1] }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}

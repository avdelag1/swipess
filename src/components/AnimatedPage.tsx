import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

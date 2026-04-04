import { motion } from 'framer-motion';
import { ReactNode } from 'react';

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.06, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.04, ease: 'circIn' },
  },
} as const;

export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="h-full w-full gpu-accelerate"
    >
      {children}
    </motion.div>
  );
}

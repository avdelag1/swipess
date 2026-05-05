import { ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * Page transition wrapper.
 * Pure opacity fade — no blur, no scale. Blur transitions on dark backgrounds
 * read as a "camera flash" on OLED screens, which is jarring at app open.
 */
export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}

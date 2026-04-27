import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.02 }}
      transition={{ 
        duration: 0.45, 
        ease: [0.22, 1, 0.36, 1], // Premium Quint Easing
        opacity: { duration: 0.3 },
        filter: { duration: 0.4 }
      }}
      className="h-full w-full gpu-accelerate"
    >
      {children}
    </motion.div>
  );
}



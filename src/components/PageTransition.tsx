import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'slide' | 'scale' | 'fade' | 'slideUp' | 'morphIn';
}

// Default page transition - ultra-fast for snappy navigation
const defaultVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

// Slide transition - horizontal movement with depth
const slideVariants = {
  initial: {
    opacity: 0,
    x: 60,
    scale: 0.95,
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    x: -40,
    scale: 0.97,
  },
};

// Scale transition - zoom effect with blur
const scaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.85,
    filter: 'blur(8px)',
  },
  in: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
  },
  out: {
    opacity: 0,
    scale: 1.05,
    filter: 'blur(4px)',
  },
};

// Fade only transition - subtle
const fadeVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
  },
  out: {
    opacity: 0,
  },
};

// Slide up with bounce - great for modals/sheets
const slideUpVariants = {
  initial: {
    opacity: 0,
    y: 100,
    scale: 0.9,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
};

// Morph in - organic entrance
const morphInVariants = {
  initial: {
    opacity: 0,
    scale: 0.92,
    borderRadius: '24px',
    filter: 'blur(10px)',
  },
  in: {
    opacity: 1,
    scale: 1,
    borderRadius: '0px',
    filter: 'blur(0px)',
  },
  out: {
    opacity: 0,
    scale: 0.96,
    filter: 'blur(6px)',
  },
};

const variantMap = {
  default: defaultVariants,
  slide: slideVariants,
  scale: scaleVariants,
  fade: fadeVariants,
  slideUp: slideUpVariants,
  morphIn: morphInVariants,
};

// Buttery smooth spring config
const pageTransition = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 32,
  mass: 0.8,
};

// Instant transition for exit
const exitTransition = {
  duration: 0.05,
  ease: [0.32, 0.72, 0, 1],
};

export function PageTransition({ children, className = '', variant = 'default' }: PageTransitionProps) {
  const variants = variantMap[variant];
  
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={variants}
      transition={{ duration: 0.08, ease: 'easeOut' }}
      className={`w-full h-full ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Staggered children container for list animations
export function StaggerContainer({ 
  children, 
  className = '',
  staggerDelay = 0.05 
}: { 
  children: ReactNode; 
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className={className}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger item
export function StaggerItem({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { 
          opacity: 0, 
          y: 20,
          scale: 0.95,
        },
        visible: { 
          opacity: 1, 
          y: 0,
          scale: 1,
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

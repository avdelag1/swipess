export const pageTransition = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.98 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const }
};

export const itemReveal = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' }
};

export const buttonPress = {
  whileTap: { scale: 0.96, transition: { duration: 0.1 } }
};

export const staggerContainer = {
  animate: { transition: { duration: 0 } },
};

/** Aladdin / genie sheet motion — transform-only (no filter:blur for GPU perf). */
export const GENIE_SPRING_OPEN = {
  type: 'spring' as const,
  damping: 24,
  stiffness: 480,
  mass: 0.35,
};

export const GENIE_SPRING_CLOSE = {
  type: 'spring' as const,
  damping: 24,
  stiffness: 420,
  mass: 0.35,
};

/** Snappy tween fallback for reduced-motion / Safari low tier */
export const GENIE_TWEEN_FAST = {
  type: 'tween' as const,
  duration: 0.16,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export const GENIE_SHEET_OPEN = {
  scaleX: 0.12,
  scaleY: 0.06,
  y: '72vh',
  opacity: 0,
  borderRadius: 56,
  filter: 'blur(15px)'
};

export const GENIE_SHEET_VISIBLE = {
  scaleX: 1,
  scaleY: 1,
  y: 0,
  opacity: 1,
  borderRadius: 24,
  filter: 'blur(0px)'
};

export const GENIE_SHEET_EXIT = {
  scaleX: 0.06,
  scaleY: 0.04,
  y: '88vh',
  opacity: 0,
  borderRadius: 999,
  filter: 'blur(20px)'
};

/** Full-screen genie (live map) — carpet flies up from bottom */
export const GENIE_FULLSCREEN_OPEN = {
  scaleX: 0.05,
  scaleY: 0.05,
  y: '45vh',
  opacity: 0,
  borderRadius: 40,
  filter: 'blur(15px)'
};

export const GENIE_FULLSCREEN_VISIBLE = {
  scaleX: 1,
  scaleY: 1,
  y: 0,
  opacity: 1,
  borderRadius: 0,
  filter: 'blur(0px)'
};

export const GENIE_FULLSCREEN_EXIT = {
  scaleX: 0.04,
  scaleY: 0.04,
  y: '55vh',
  opacity: 0,
  borderRadius: 999,
  filter: 'blur(20px)'
};

export const GENIE_ORIGIN_BOTTOM = { transformOrigin: 'bottom center' } as const;
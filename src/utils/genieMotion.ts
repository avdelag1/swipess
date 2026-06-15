/** Aladdin / genie sheet motion — transform-only (no filter:blur for GPU perf). */
export const GENIE_SPRING_OPEN = {
  type: 'spring' as const,
  damping: 26,
  stiffness: 320,
  mass: 0.72,
};

export const GENIE_SPRING_CLOSE = {
  type: 'spring' as const,
  damping: 22,
  stiffness: 280,
  mass: 0.65,
};

export const GENIE_SHEET_OPEN = {
  scaleX: 0.12,
  scaleY: 0.06,
  y: '72vh',
  opacity: 0,
  borderRadius: 56,
};

export const GENIE_SHEET_VISIBLE = {
  scaleX: 1,
  scaleY: 1,
  y: 0,
  opacity: 1,
  borderRadius: 24,
};

export const GENIE_SHEET_EXIT = {
  scaleX: 0.06,
  scaleY: 0.04,
  y: '88vh',
  opacity: 0,
  borderRadius: 999,
};

/** Full-screen genie (live map) — carpet flies up from bottom */
export const GENIE_FULLSCREEN_OPEN = {
  scaleX: 0.35,
  scaleY: 0.2,
  y: '38vh',
  opacity: 0,
  borderRadius: 40,
};

export const GENIE_FULLSCREEN_VISIBLE = {
  scaleX: 1,
  scaleY: 1,
  y: 0,
  opacity: 1,
  borderRadius: 0,
};

export const GENIE_FULLSCREEN_EXIT = {
  scaleX: 0.08,
  scaleY: 0.05,
  y: '55vh',
  opacity: 0,
  borderRadius: 999,
};

export const GENIE_ORIGIN_BOTTOM = { transformOrigin: 'bottom center' } as const;
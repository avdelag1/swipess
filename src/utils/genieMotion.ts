/**
 * Aladdin / genie sheet motion — ONLY for:
 *   - VapIdCardModal (VAP identity card)
 *   - ConciergeChat (AI chat window)
 *
 * Do NOT use on PassportMapModal or other full-screen surfaces: Mapbox WebGL
 * (and some iOS WebViews) fail when a parent is scale-transformed.
 */

export const GENIE_SPRING_OPEN = {
  type: 'spring' as const,
  damping: 22,
  stiffness: 250,
  mass: 0.8,
};

export const GENIE_SPRING_CLOSE = {
  type: 'spring' as const,
  stiffness: 180,
  damping: 22,
  mass: 0.6,
  duration: 0.42,
};

/** Open: carpet expands from bottom center */
export const GENIE_PANEL_OPEN = {
  scaleX: 0.05,
  scaleY: 0.05,
  y: '45vh',
  opacity: 0,
  filter: 'blur(15px)',
};

export const GENIE_PANEL_VISIBLE = {
  scaleX: 1,
  scaleY: 1,
  y: 0,
  opacity: 1,
  filter: 'blur(0px)',
};

/** Close: shrink + drop toward dock */
export const GENIE_PANEL_EXIT = {
  scale: 0.04,
  y: 520,
  x: 0,
  opacity: 0,
  filter: 'blur(20px)',
  borderRadius: '999px',
};

export const GENIE_ORIGIN_BOTTOM = { transformOrigin: 'bottom center' } as const;

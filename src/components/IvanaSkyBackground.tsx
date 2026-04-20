import React from 'react';

/**
 * IvanaSkyBackground
 * 
 * Clean, static sky gradient background for the Ivanna theme.
 * No animated clouds — just a smooth, painterly gradient 
 * from warm champagne at the horizon to clear periwinkle-blue overhead.
 * Lightweight and production-ready.
 */
export function IvanaSkyBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        background: `linear-gradient(
          to top,
          hsl(38, 90%, 86%) 0%,
          hsl(32, 75%, 82%) 8%,
          hsl(20, 55%, 80%) 18%,
          hsl(340, 35%, 82%) 28%,
          hsl(280, 25%, 82%) 42%,
          hsl(220, 40%, 80%) 58%,
          hsl(210, 55%, 76%) 75%,
          hsl(205, 65%, 68%) 100%
        )`,
      }}
    />
  );
}

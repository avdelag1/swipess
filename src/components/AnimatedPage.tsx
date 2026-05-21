import { ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * Page transition wrapper.
 * Pure opacity fade — no blur, no scale. Blur transitions on dark backgrounds
 * read as a "camera flash" on OLED screens, which is jarring at app open.
 */
export function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full">
      {children}
    </div>
  );
}

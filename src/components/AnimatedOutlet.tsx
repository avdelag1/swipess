import React, { useRef } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ANIMATED OUTLET
 *
 * Direction-aware page transitions:
 * - Between bottom-nav tabs (same level): cross-fade only — clean and instant
 * - To/from deeper pages: subtle slide-up + fade — feels like entering a new layer
 *
 * Exit is always a clean fade (no Y movement) so returning to any page
 * looks identical to arriving at it for the first time.
 */

// All bottom-nav level routes — transitions between these use cross-fade only
const MAIN_NAV_PATHS = new Set([
  '/client/dashboard',
  '/client/profile',
  '/client/liked-properties',
  '/client/filters',
  '/owner/dashboard',
  '/owner/profile',
  '/owner/liked-clients',
  '/owner/properties',
  '/owner/filters',
  '/messages',
  '/explore/roommates',
  '/admin/eventos',
]);

function isMainNav(path: string) {
  return MAIN_NAV_PATHS.has(path);
}

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const prevPath = useRef<string>(location.pathname);

  const currentPath = location.pathname;
  const wasMain = isMainNav(prevPath.current);
  const isMain = isMainNav(currentPath);

  // Tab-to-tab navigation: cross-fade, no movement
  const tabSwitch = wasMain && isMain;

  const enterVariant = tabSwitch
    ? { opacity: 0, scale: 0.99 }
    : { opacity: 0, y: 20 };

  const animateVariant = tabSwitch
    ? { opacity: 1, scale: 1, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } }
    : { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } };

  const exitVariant = { opacity: 0, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } };

  // Track previous path for next render
  prevPath.current = currentPath;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={enterVariant}
        animate={animateVariant}
        exit={exitVariant}
        className="h-full w-full flex flex-col flex-1"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}

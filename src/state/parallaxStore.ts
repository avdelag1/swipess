/**
 * PARALLAX STATE STORE
 * 
 * Minimal Zustand store for sharing swipe drag state globally.
 * Used by DepthParallaxBackground to create ambient depth effect.
 * 
 * Performance-focused:
 * - Only stores primitive values (no objects that cause re-renders)
 * - Non-reactive getters available for RAF loops
 */

import { create } from 'zustand';

interface ParallaxState {
  dragX: number;
  dragY: number;
  isDragging: boolean;
  velocityX: number;
  
  // Update during drag
  updateDrag: (x: number, y: number, velocityX?: number) => void;
  
  // Reset when drag ends
  endDrag: () => void;
}

export const useParallaxStore = create<ParallaxState>((set) => ({
  dragX: 0,
  dragY: 0,
  isDragging: false,
  velocityX: 0,
  
  updateDrag: (x, y, velocityX = 0) => {
    set({ dragX: x, dragY: y, isDragging: true, velocityX });
  },
  
  endDrag: () => {
    set({ isDragging: false, velocityX: 0 });
    // Note: dragX/Y will animate back to 0 in the background component
  },
}));

// Non-reactive getters for performance-critical reads
export const getParallaxState = () => useParallaxStore.getState();

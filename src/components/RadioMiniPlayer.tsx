/**
 * Radio Mini Player Bubble
 * Floating draggable player that appears when radio is playing
 * and user is NOT on the radio page
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { Play, Pause, Volume2, GripVertical } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function RadioMiniPlayer() {
  const { state, togglePlayPause } = useRadio();
  const navigate = useNavigate();
  const location = useLocation();

  // Draggable position state - persists across renders
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const constraintsRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Track if we're dragging to prevent click events
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback((_event: any, info: PanInfo) => {
    // Update position so it stays where dropped
    setPosition(prev => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y,
    }));
    // Delay resetting drag flag to prevent click from firing
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  }, []);

  const handleNavigateToRadio = useCallback(() => {
    if (!isDraggingRef.current) {
      navigate('/radio');
    }
  }, [navigate]);

  const handleTogglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current) {
      togglePlayPause();
    }
  }, [togglePlayPause]);

  // Don't show if not playing or no station
  if (!state.isPlaying || !state.currentStation) return null;

  // Don't show on radio pages - only show when navigated away
  const isOnRadioPage = location.pathname.startsWith('/radio');
  if (isOnRadioPage) return null;

  return (
    <>
      {/* Invisible full-screen drag constraints boundary */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-[49]"
        style={{ margin: '10px' }}
      />

      <AnimatePresence>
        <motion.div
          key="radio-mini-player"
          initial={{ y: 100, opacity: 0, scale: 0.8 }}
          animate={{
            x: position.x,
            y: position.y,
            opacity: 1,
            scale: 1,
          }}
          exit={{ y: 100, opacity: 0, scale: 0.8 }}
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.05, zIndex: 100 }}
          className="fixed bottom-20 right-4 z-50 touch-none cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-lg rounded-full shadow-lg border border-white/20">
            {/* Drag indicator */}
            <div className="flex items-center justify-center opacity-40">
              <GripVertical className="w-3 h-3 text-white" />
            </div>

            {/* Album art placeholder */}
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 animate-pulse" />
            </div>

            {/* Station info - tap to navigate */}
            <button
              onClick={handleNavigateToRadio}
              className="flex flex-col min-w-0 flex-1 text-left"
            >
              <span className="text-xs font-medium text-white truncate max-w-[100px]">
                {state.currentStation.name}
              </span>
              <span className="text-[10px] text-white/60 truncate max-w-[100px]">
                {state.currentStation.genre}
              </span>
            </button>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleTogglePlay}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
              >
                {state.isPlaying ? (
                  <Pause className="w-4 h-4 text-black" fill="currentColor" />
                ) : (
                  <Play className="w-4 h-4 text-black ml-0.5" fill="currentColor" />
                )}
              </button>

              <button
                onClick={handleNavigateToRadio}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Volume2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

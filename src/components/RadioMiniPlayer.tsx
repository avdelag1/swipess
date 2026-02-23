/**
 * Radio Mini Player Bubble
 * Floating draggable player that appears when radio is playing
 * and user is NOT on the radio page
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { Play, Pause, SkipBack, SkipForward, GripVertical } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function RadioMiniPlayer() {
  const { state, togglePlayPause, changeStation } = useRadio();
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

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current) {
      changeStation('prev');
    }
  }, [changeStation]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current) {
      changeStation('next');
    }
  }, [changeStation]);

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
          className="fixed bottom-20 right-3 z-50 touch-none cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white/10 backdrop-blur-lg rounded-full shadow-lg border border-white/20 max-w-[240px]">
            {/* Drag indicator */}
            <div className="flex items-center justify-center opacity-40">
              <GripVertical className="w-2.5 h-2.5 text-white" />
            </div>

            {/* Album art placeholder */}
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 animate-pulse" />
            </div>

            {/* Station info - tap to navigate */}
            <button
              onClick={handleNavigateToRadio}
              className="flex flex-col min-w-0 flex-1 text-left"
            >
              <span className="text-[10px] font-medium text-white truncate max-w-[70px]">
                {state.currentStation.name}
              </span>
              <span className="text-[8px] text-white/60 truncate max-w-[70px]">
                {state.currentStation.genre}
              </span>
            </button>

            {/* Skip Prev */}
            <button
              onClick={handlePrev}
              className="w-5 h-5 flex items-center justify-center flex-shrink-0 opacity-80 hover:opacity-100"
            >
              <SkipBack className="w-3 h-3 text-white" fill="currentColor" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={handleTogglePlay}
              className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0"
            >
              {state.isPlaying ? (
                <Pause className="w-3 h-3 text-black" fill="currentColor" />
              ) : (
                <Play className="w-3 h-3 text-black ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Skip Next */}
            <button
              onClick={handleNext}
              className="w-5 h-5 flex items-center justify-center flex-shrink-0 opacity-80 hover:opacity-100"
            >
              <SkipForward className="w-3 h-3 text-white" fill="currentColor" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

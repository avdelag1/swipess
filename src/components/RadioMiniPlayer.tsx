/**
 * Radio Mini Player Bubble
 * Floating draggable player that appears when radio is playing
 * and user is NOT on the radio page
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { Play, Pause, SkipBack, SkipForward, GripVertical, X, Minus, Music } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function RadioMiniPlayer() {
  const { state, togglePlayPause, changeStation, setMiniPlayerMode, pause } = useRadio();
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

  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMiniPlayerMode('minimized');
  }, [setMiniPlayerMode]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    pause(); // usually closing implies stopping playing, but even if not, we hide it completely
    setMiniPlayerMode('closed');
  }, [setMiniPlayerMode, pause]);

  // Don't show if not playing or no station
  if (!state.isPlaying || !state.currentStation) return null;

  // Don't show on radio pages - only show when navigated away
  const isOnRadioPage = location.pathname.startsWith('/radio');
  if (isOnRadioPage) return null;

  // If closed explicitly by user
  if (state.miniPlayerMode === 'closed') return null;

  return (
    <>
      {/* Invisible full-screen drag constraints boundary */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-[49]"
        style={{ margin: '10px' }}
      />

      <AnimatePresence mode="wait">
        {state.miniPlayerMode === 'minimized' ? (
          <motion.div
            key="radio-mini-player-minimized"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-1/2 right-0 -translate-y-1/2 z-50 bg-white/10 backdrop-blur-md border border-white/20 border-r-0 rounded-l-xl px-2 py-3 shadow-2xl cursor-pointer hover:bg-white/20 transition-colors"
            onClick={() => setMiniPlayerMode('expanded')}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 animate-pulse flex items-center justify-center shadow-lg">
                <Music className="w-3 h-3 text-white" />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="radio-mini-player-expanded"
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
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white/10 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/20 min-w-[260px] max-w-[300px]">
              {/* Drag indicator */}
              <div className="flex items-center justify-center opacity-40">
                <GripVertical className="w-2.5 h-2.5 text-white" />
              </div>

              {/* Album art placeholder */}
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 animate-pulse flex items-center justify-center">
                  <Music className="w-2.5 h-2.5 text-white/80" />
                </div>
              </div>

              {/* Station info - tap to navigate */}
              <button
                onClick={handleNavigateToRadio}
                className="flex flex-col min-w-0 flex-1 text-left px-1"
              >
                <span className="text-[10px] font-bold text-white truncate w-full">
                  {state.currentStation.name}
                </span>
                <span className="text-[8px] text-white/60 truncate w-full">
                  {state.currentStation.genre}
                </span>
              </button>

              {/* Controls */}
              <div className="flex items-center justify-center gap-1.5 flex-shrink-0 border-r border-white/10 pr-2">
                <button
                  onClick={handlePrev}
                  className="w-5 h-5 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                  aria-label="Previous station"
                >
                  <SkipBack className="w-3 h-3 text-white" fill="currentColor" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
                  aria-label={state.isPlaying ? "Pause" : "Play"}
                >
                  {state.isPlaying ? (
                    <Pause className="w-3.5 h-3.5 text-black" fill="currentColor" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-black ml-0.5" fill="currentColor" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className="w-5 h-5 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                  aria-label="Next station"
                >
                  <SkipForward className="w-3 h-3 text-white" fill="currentColor" />
                </button>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1 pl-1 pr-1 flex-shrink-0">
                <button
                  onClick={handleMinimize}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors opacity-80 hover:opacity-100 bg-black/20"
                  aria-label="Minimize player"
                >
                  <Minus className="w-3 h-3 text-white" />
                </button>
                <button
                  onClick={handleClose}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-500/80 transition-colors opacity-80 hover:opacity-100 bg-red-500/40"
                  aria-label="Close player"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

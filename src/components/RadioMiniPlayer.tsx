import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { Play, Pause, SkipBack, SkipForward, GripVertical, Power } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

export function RadioMiniPlayer() {
  const { state, togglePlayPause, changeStation, togglePower } = useRadio();
  const navigate = useNavigate();
  const location = useLocation();

  // Draggable position state - persists across renders
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const constraintsRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Track if we're dragging to prevent click events
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    triggerHaptic('light');
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
      triggerHaptic('medium');
      navigate('/radio');
    }
  }, [navigate]);

  const handleTogglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current) {
      triggerHaptic('light');
      togglePlayPause();
    }
  }, [togglePlayPause]);

  const handleTogglePower = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current) {
      triggerHaptic('medium');
      togglePower();
    }
  }, [togglePower]);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current) {
      triggerHaptic('light');
      changeStation('prev');
    }
  }, [changeStation]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current) {
      triggerHaptic('light');
      changeStation('next');
    }
  }, [changeStation]);

  // Don't show if powered off or no station
  if (!state.isPoweredOn || !state.currentStation) return null;

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
        style={{ margin: '20px' }}
      />

      <AnimatePresence>
        <motion.div
          key="radio-mini-player"
          initial={{ y: 100, opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          animate={{
            x: position.x,
            y: position.y,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
          }}
          exit={{ y: 100, opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.15}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.1, zIndex: 100 }}
          className="fixed bottom-24 right-4 z-50 touch-none cursor-grab active:cursor-grabbing group"
          style={{ touchAction: 'none' }}
        >
          {/* Floating Glow (Fluorine effect) */}
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl animate-pulse -z-10 group-hover:bg-blue-400/30 transition-colors" />

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-2xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 max-w-[280px] ring-1 ring-white/10"
          >
            {/* Draggable indicator */}
            <div className="flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity pr-1">
              <GripVertical className="w-4 h-4 text-white" />
            </div>

            {/* Power Button */}
            <button
              onClick={handleTogglePower}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90",
                state.isPoweredOn ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/10 text-white/40"
              )}
            >
              <Power className="w-4 h-4" />
            </button>

            {/* Album Art / Station Orb */}
            <div className="relative w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                {state.currentStation.albumArt ? (
                  <img src={state.currentStation.albumArt} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500/40 to-purple-600/40 animate-pulse" />
                )}
              </div>
              {state.isPlaying && (
                <div className="absolute -inset-1 rounded-full border border-blue-400/50 animate-ping opacity-20" />
              )}
            </div>

            {/* Station info - tap to navigate */}
            <button
              onClick={handleNavigateToRadio}
              className="flex flex-col min-w-0 flex-1 text-left px-1"
            >
              <span className="text-[11px] font-black text-white truncate tracking-tight uppercase">
                {state.currentStation.name}
              </span>
              <span className="text-[9px] font-bold text-blue-400/80 truncate uppercase tracking-widest">
                {state.currentStation.genre || 'LIVE STATION'}
              </span>
            </button>

            {/* Controls */}
            <div className="flex items-center gap-1 pr-1">
              <button
                onClick={handlePrev}
                className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition-transform active:scale-90"
              >
                {state.isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={handleNext}
                className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

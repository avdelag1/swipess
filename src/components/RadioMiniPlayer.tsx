import { useCallback, useRef, useState } from 'react';
import { m, AnimatePresence, PanInfo } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';

// Safe navigation hook that won't crash outside Router context
function useSafeNavigate() {
  try {
    const { useNavigate, useLocation } = require('react-router-dom');
    const nav = useNavigate();
    const loc = useLocation();
    return { navigate: nav, location: loc };
  } catch {
    return { navigate: (_: string) => {}, location: { pathname: '/' } };
  }
}

export function RadioMiniPlayer() {
  const { state, togglePlayPause, changeStation, pause, setMiniPlayerMode } = useRadio();
  
  // Use react-router hooks with an inline safe pattern
  let navigate: (path: string) => void;
  let location: { pathname: string };
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const nav = require('react-router-dom').useNavigate();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const loc = require('react-router-dom').useLocation();
    navigate = nav;
    location = loc;
  } catch {
    navigate = () => {};
    location = { pathname: '/' };
  }

  const constraintsRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleNavigateToRadio = useCallback(() => {
    triggerHaptic('medium');
    navigate('/radio');
  }, [navigate]);

  const handleTogglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    togglePlayPause();
  }, [togglePlayPause]);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    changeStation('prev');
  }, [changeStation]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    changeStation('next');
  }, [changeStation]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    pause();
    setMiniPlayerMode('closed');
  }, [pause, setMiniPlayerMode]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    setPosition(prev => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y,
    }));
  }, []);

  if (!state.isPoweredOn || !state.currentStation) return null;

  const isOnRadioPage = location.pathname.startsWith('/radio');
  if (isOnRadioPage) return null;

  if (state.miniPlayerMode === 'closed') return null;

  return (
    <>
      {/* Invisible full-screen drag constraints */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />

      <AnimatePresence>
        <m.div
          key="radio-mini-player"
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          initial={{ x: 0, y: 100, opacity: 0, scale: 0.8 }}
          animate={{ x: position.x, y: position.y, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.8 }}
          className="fixed bottom-24 right-4 z-50 group cursor-grab active:cursor-grabbing touch-none"
        >
          {/* Floating Glow */}
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl -z-10 group-hover:bg-blue-400/30 transition-colors" />

          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-black/60 backdrop-blur-2xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-white/20 max-w-[300px] ring-1 ring-white/10">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-90"
              title="Close Radio"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Album Art / Station Orb */}
            <div className="relative w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg">
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

            {/* Station info */}
            <button
              onClick={handleNavigateToRadio}
              className="flex flex-col min-w-0 flex-1 text-left px-1"
            >
              <span className="text-[10px] font-black text-white truncate tracking-tight uppercase">
                {state.currentStation.name}
              </span>
              <span className="text-[8px] font-bold text-blue-400/90 truncate uppercase tracking-widest leading-none mt-0.5">
                {state.currentStation.genre || 'LIVE'}
              </span>
            </button>

            {/* Controls */}
            <div className="flex items-center gap-0.5 pr-0.5">
              <button
                onClick={handlePrev}
                className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <SkipBack className="w-3.5 h-3.5 fill-current" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                {state.isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={handleNext}
                className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        </m.div>
      </AnimatePresence>
    </>
  );
}

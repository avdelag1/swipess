import { useCallback, useRef, useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { Play, Pause, SkipBack, SkipForward, X, Radio, Volume2, VolumeX } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

type MiniMode = 'bubble' | 'expanded' | 'docked';

function RadioMiniPlayerInner() {
  const { state, togglePlayPause, changeStation, pause, setMiniPlayerMode, setVolume } = useRadio();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mode, setMode] = useState<MiniMode>('bubble');
  const [isHovered, setIsHovered] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // RESET IDLE TIMER on ANY interaction
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    // Only auto-dock if we are in bubble mode
    if (mode === 'bubble') {
      idleTimerRef.current = setTimeout(() => {
        setMode('docked');
      }, 5000);
    }
  }, [mode]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  // Global activity listener to wake it up from docked
  useEffect(() => {
    const handleGlobalActivity = () => {
      if (mode === 'docked') {
        setMode('bubble');
        resetIdleTimer();
      }
    };
    window.addEventListener('mousemove', handleGlobalActivity);
    window.addEventListener('touchstart', handleGlobalActivity);
    return () => {
      window.removeEventListener('mousemove', handleGlobalActivity);
      window.removeEventListener('touchstart', handleGlobalActivity);
    };
  }, [mode, resetIdleTimer]);

  const handleTogglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    togglePlayPause();
    resetIdleTimer();
  }, [togglePlayPause, resetIdleTimer]);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    changeStation('prev');
    resetIdleTimer();
  }, [changeStation, resetIdleTimer]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    changeStation('next');
    resetIdleTimer();
  }, [changeStation, resetIdleTimer]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    pause();
    setMiniPlayerMode('closed');
  }, [pause, setMiniPlayerMode]);

  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setMode('bubble');
    resetIdleTimer();
  }, [resetIdleTimer]);

  const handleNavigate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    navigate('/radio');
  }, [navigate]);

  const handleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setVolume(state.volume > 0 ? 0 : 0.8);
    resetIdleTimer();
  }, [state.volume, setVolume, resetIdleTimer]);

  if (!state.isPoweredOn || !state.currentStation) return null;
  if (location.pathname.startsWith('/radio')) return null;
  if (state.miniPlayerMode === 'closed') return null;

  const station = state.currentStation;

  return (
    <AnimatePresence mode="popLayout">
      {/* ─── DOCKED STATE (EDGE INDICATOR) ─── */}
      {mode === 'docked' && (
        <m.button
          key="radio-docked"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 16, opacity: 1 }}
          exit={{ x: 60, opacity: 0 }}
          whileHover={{ x: 8 }}
          onClick={() => { setMode('bubble'); triggerHaptic('light'); }}
          className="fixed bottom-32 right-0 z-[100] w-14 h-14 rounded-l-full flex items-center justify-start pl-3 glass-nano-texture border border-white/10 shadow-2xl"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
            {state.isPlaying ? (
              <div className="flex gap-0.5 items-end h-3">
                <m.div animate={{ height: [4, 12, 6, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-blue-400 rounded-full" />
                <m.div animate={{ height: [6, 4, 12, 4, 6] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-0.5 bg-blue-400 rounded-full" />
                <m.div animate={{ height: [12, 6, 4, 6, 12] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-0.5 bg-blue-400 rounded-full" />
              </div>
            ) : (
                <Radio className="w-4 h-4 text-white/40" />
            )}
            <m.div 
               animate={state.isPlaying ? { rotate: 360 } : {}} 
               transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
               className="absolute inset-0 border border-blue-500/30 rounded-full border-dashed"
            />
          </div>
        </m.button>
      )}

      {/* ─── BUBBLE STATE ─── */}
      {mode === 'bubble' && (
        <m.div
          key="radio-bubble"
          initial={{ scale: 0, opacity: 0, x: 20 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0, opacity: 0, x: 20 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="fixed bottom-32 right-4 z-[100]"
        >
          <div className="relative group">
             {/* Glow effect */}
             <div className="absolute -inset-1 rounded-full bg-blue-500/20 blur-lg transition-opacity opacity-0 group-hover:opacity-100" />
             
             <m.button
                onClick={() => { setMode('expanded'); triggerHaptic('medium'); }}
                className="w-14 h-14 rounded-full flex items-center justify-center relative shadow-2xl overflow-hidden glass-nano-texture border border-white/10"
                style={{ background: 'rgba(0,0,0,0.45)' }}
             >
                {station.albumArt ? (
                  <img src={station.albumArt} alt="" className={cn("w-full h-full object-cover rounded-full transition-transform duration-700", state.isPlaying && "animate-spin-slow")} />
                ) : (
                  <Radio className="w-6 h-6 text-white" strokeWidth={1.8} />
                )}
                
                {state.isPlaying && (
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping-slow" />
                )}
             </m.button>

             {/* Mini quick controls on hover */}
             <AnimatePresence>
                {isHovered && (
                  <m.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/80 backdrop-blur-xl border border-white/10 p-1 rounded-full shadow-2xl"
                  >
                     <button onClick={handlePrev} className="p-2 text-white/60 hover:text-white active:scale-90 transition-all"><SkipBack className="w-3.5 h-3.5 fill-current" /></button>
                     <button onClick={handleTogglePlay} className="p-2 text-white hover:text-blue-400 active:scale-90 transition-all">
                        {state.isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                     </button>
                     <button onClick={handleNext} className="p-2 text-white/60 hover:text-white active:scale-90 transition-all"><SkipForward className="w-3.5 h-3.5 fill-current" /></button>
                  </m.div>
                )}
             </AnimatePresence>
          </div>
        </m.div>
      )}

      {/* ─── EXPANDED STATE ─── */}
      {mode === 'expanded' && (
        <m.div
          key="radio-expanded"
          initial={{ scale: 0.8, opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ scale: 1, opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ scale: 0.8, opacity: 0, y: 20, filter: 'blur(10px)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          className="fixed bottom-32 right-4 z-[100] w-[300px]"
        >
          {/* Liquid Glass Container */}
          <div
            className="rounded-[28px] overflow-hidden shadow-[0_22px_70px_8px_rgba(0,0,0,0.56)] border border-white/10 glass-ultra-dark"
            style={{ 
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(40px) saturate(1.8)'
            }}
          >
            {/* Top rim catch-light */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Top bar */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
              <button
                onClick={handleMinimize}
                className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] hover:text-white/60 transition-colors"
              >
                Minimize
              </button>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-90"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            {/* Station info row */}
            <button onClick={handleNavigate} className="flex items-center gap-4 px-4 pb-4 w-full text-left group">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/10 group-active:scale-95 transition-transform duration-300">
                {station.albumArt ? (
                  <img src={station.albumArt} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-white/40" />
                  </div>
                )}
                {state.isPlaying && (
                  <div className="absolute top-1 right-1">
                      <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-black text-white truncate tracking-tight">{station.name}</p>
                <p className="text-[11px] font-bold text-blue-400/60 truncate uppercase tracking-widest mt-0.5">
                  {station.frequency} · {station.genre || 'LIVE'}
                </p>
              </div>
            </button>

            {/* Controls */}
            <div className="flex items-center justify-between px-4 pb-5 pt-1">
              <button
                onClick={handleMute}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors active:scale-90"
              >
                {state.volume > 0 ? (
                  <Volume2 className="w-4.5 h-4.5" />
                ) : (
                  <VolumeX className="w-4.5 h-4.5" />
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-90 transition-all"
                >
                  {state.isPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-1" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </div>

              <div className="w-10" /> {/* Spacer */}
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

// Error-safe wrapper
import { Component, type ReactNode } from 'react';

class RadioErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() {}
  render() { return this.state.hasError ? null : this.props.children; }
}

export function RadioMiniPlayer() {
  return (
    <RadioErrorBoundary>
      <RadioMiniPlayerInner />
    </RadioErrorBoundary>
  );
}



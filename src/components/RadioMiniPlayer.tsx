import { useCallback, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { Play, Pause, SkipBack, SkipForward, X, Radio, Volume2, VolumeX } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { triggerHaptic } from '@/utils/haptics';

type MiniMode = 'bubble' | 'expanded';

function RadioMiniPlayerInner() {
  const { state, togglePlayPause, changeStation, pause, setMiniPlayerMode, setVolume } = useRadio();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<MiniMode>('expanded');
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleCollapse = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setMode('bubble'), 6000);
  }, []);

  const cancelCollapse = useCallback(() => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
  }, []);

  const handleBubbleTap = useCallback(() => {
    triggerHaptic('medium');
    setMode('expanded');
    cancelCollapse();
  }, [cancelCollapse]);

  const handleInteraction = useCallback(() => {
    cancelCollapse();
    scheduleCollapse();
  }, [cancelCollapse, scheduleCollapse]);

  const handleTogglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    togglePlayPause();
    handleInteraction();
  }, [togglePlayPause, handleInteraction]);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    changeStation('prev');
    handleInteraction();
  }, [changeStation, handleInteraction]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    changeStation('next');
    handleInteraction();
  }, [changeStation, handleInteraction]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    pause();
    setMiniPlayerMode('closed');
    cancelCollapse();
  }, [pause, setMiniPlayerMode, cancelCollapse]);

  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setMode('bubble');
    cancelCollapse();
  }, [cancelCollapse]);

  const handleNavigate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    navigate('/radio');
  }, [navigate]);

  const handleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setVolume(state.volume > 0 ? 0 : 0.8);
    handleInteraction();
  }, [state.volume, setVolume, handleInteraction]);

  if (!state.isPoweredOn || !state.currentStation) return null;
  if (location.pathname.startsWith('/radio')) return null;
  if (state.miniPlayerMode === 'closed') return null;

  const station = state.currentStation;

  return (
    <AnimatePresence mode="wait">
      {mode === 'bubble' ? (
        /* ─── BUBBLE STATE ─── */
        <m.button
          key="radio-bubble"
          onClick={handleBubbleTap}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="fixed bottom-28 right-3 z-50 w-12 h-12 rounded-full shadow-[0_4px_24px_rgba(59,130,246,0.4)] active:scale-90 transition-transform duration-[40ms]"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
        >
          <div className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden">
            {station.albumArt ? (
              <img src={station.albumArt} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <Radio className="w-5 h-5 text-white" strokeWidth={1.8} />
            )}
            {state.isPlaying && (
              <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />
            )}
          </div>
        </m.button>
      ) : (
        /* ─── EXPANDED STATE ─── */
        <m.div
          key="radio-expanded"
          initial={{ scale: 0.3, opacity: 0, y: 40, borderRadius: '50%' }}
          animate={{ scale: 1, opacity: 1, y: 0, borderRadius: '20px' }}
          exit={{ scale: 0.3, opacity: 0, y: 40, borderRadius: '50%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          className="fixed bottom-28 right-3 z-50 w-[280px]"
        >
          {/* Glow */}
          <div className="absolute -inset-2 rounded-[28px] bg-blue-500/15 blur-2xl -z-10" />

          <div
            className="rounded-[20px] overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.6)] border border-white/[0.08]"
            style={{ background: 'linear-gradient(160deg, rgba(15,15,30,0.95), rgba(10,10,25,0.98))' }}
          >
            {/* Top bar: minimize + close */}
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
              <button
                onClick={handleMinimize}
                className="text-[9px] font-bold text-white/40 uppercase tracking-[0.15em] hover:text-white/70 transition-colors active:scale-90 duration-[40ms]"
              >
                Minimize
              </button>
              <button
                onClick={handleClose}
                className="w-6 h-6 rounded-full flex items-center justify-center bg-red-500/15 text-red-400/80 hover:bg-red-500/25 transition-all active:scale-90 duration-[40ms]"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>

            {/* Station info row */}
            <button onClick={handleNavigate} className="flex items-center gap-3 px-3 pb-2 w-full text-left active:scale-[0.98] transition-transform duration-[40ms]">
              <div className="relative w-11 h-11 rounded-[12px] overflow-hidden ring-1 ring-white/10 shrink-0">
                {station.albumArt ? (
                  <img src={station.albumArt} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500/40 to-purple-600/40 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-white/60" strokeWidth={1.5} />
                  </div>
                )}
                {state.isPlaying && (
                  <div className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-white truncate leading-tight">{station.name}</p>
                <p className="text-[10px] font-semibold text-cyan-400/80 truncate uppercase tracking-wider mt-0.5">
                  {station.frequency} · {station.genre || 'LIVE'}
                </p>
              </div>
            </button>

            {/* Controls */}
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <button
                onClick={handleMute}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition-colors active:scale-90 duration-[40ms]"
              >
                {state.volume > 0 ? (
                  <Volume2 className="w-4 h-4" strokeWidth={1.8} />
                ) : (
                  <VolumeX className="w-4 h-4" strokeWidth={1.8} />
                )}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors active:scale-90 duration-[40ms]"
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-[0_4px_16px_rgba(255,255,255,0.2)] active:scale-90 transition-transform duration-[40ms]"
                >
                  {state.isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors active:scale-90 duration-[40ms]"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>
              </div>

              <button
                onClick={handleNavigate}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition-colors active:scale-90 duration-[40ms]"
              >
                <Radio className="w-4 h-4" strokeWidth={1.8} />
              </button>
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

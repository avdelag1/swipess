import { useCallback, useRef, useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { Play, Pause, SkipBack, SkipForward, X, Radio, Volume2, VolumeX, Heart, Star, Shuffle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

function RadioMiniPlayerInner() {
  const { state, togglePlayPause, changeStation, pause, setMiniPlayerMode, setVolume, toggleFavorite, isStationFavorite, shuffleAndPlay } = useRadio();
  const { isLight } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [expanded, setExpanded] = useState(false);

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

  const handleNavigate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    navigate('/radio');
  }, [navigate]);

  const handleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setVolume(state.volume > 0 ? 0 : 0.8);
  }, [state.volume, setVolume]);

  if (!state.isPoweredOn || !state.currentStation) return null;
  if (location.pathname.startsWith('/radio')) return null;
  if (state.miniPlayerMode === 'closed') return null;

  const station = state.currentStation;

  // Position above bottom nav using CSS variable
  const bottomStyle = { bottom: 'calc(var(--bottom-nav-height, 72px) + var(--safe-bottom, 0px) + 12px)' };

  return (
    <AnimatePresence mode="popLayout">
      {!expanded ? (
        /* ── BUBBLE ── */
        <m.div
          key="radio-bubble"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="fixed right-4 z-[200] flex items-center gap-2"
          style={bottomStyle}
        >
          {/* Play/pause pill */}
          <m.button
            onClick={handleTogglePlay}
            className={cn(
              "flex items-center gap-2 h-12 px-4 rounded-full shadow-2xl border backdrop-blur-xl transition-all active:scale-95",
              isLight ? "bg-white border-black/[0.05] text-black" : "bg-black/80 border-white/15 text-white"
            )}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              {station.albumArt ? (
                <img src={station.albumArt} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/20">
                  <Radio className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
            {state.isPlaying ? (
              <Pause className="w-4 h-4 fill-current flex-shrink-0" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5 flex-shrink-0" />
            )}
            {state.isPlaying && (
              <div className="flex items-end gap-[2px] h-3 flex-shrink-0">
                {[1,2,3].map(i => (
                  <m.div
                    key={i}
                    className="w-[2px] bg-primary rounded-full"
                    animate={{ height: ['4px', '12px', '4px'] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            )}
          </m.button>

          {/* Expand button */}
          <button
            onClick={() => { setExpanded(true); triggerHaptic('light'); }}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border shadow-xl backdrop-blur-xl active:scale-90 transition-all",
              isLight ? "bg-white/90 border-black/[0.05] text-black/40" : "bg-black/60 border-white/15 text-white/60"
            )}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 5l5-3 5 3M2 9l5 3 5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </m.div>
      ) : (
        /* ── EXPANDED CARD ── */
        <m.div
          key="radio-expanded"
          initial={{ scale: 0.85, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          className="fixed right-4 z-[200] w-[300px]"
          style={bottomStyle}
        >
          <div className={cn(
            "rounded-[28px] overflow-hidden shadow-[0_22px_70px_8px_rgba(0,0,0,0.56)] border backdrop-blur-3xl",
            isLight ? "bg-white/95 border-black/[0.05]" : "bg-black/85 border-white/10"
          )}>
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
              <button
                onClick={() => { setExpanded(false); triggerHaptic('light'); }}
                className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isLight ? "text-black/30" : "text-white/50")}
              >
                Minimize
              </button>
              <button
                onClick={handleClose}
                className={cn("w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90", isLight ? "bg-black/[0.03] text-black/40" : "bg-white/5 text-white/70")}
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            {/* Station info */}
            <button onClick={handleNavigate} className="flex items-center gap-4 px-4 pb-4 w-full text-left active:opacity-80">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl flex-shrink-0">
                {station.albumArt ? (
                  <img src={station.albumArt} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className={cn("w-full h-full flex items-center justify-center", isLight ? "bg-black/[0.03]" : "bg-primary/20")}>
                    <Radio className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[15px] font-black truncate", isLight ? "text-black" : "text-white")}>{station.name}</p>
                <p className={cn("text-[11px] font-bold truncate uppercase tracking-widest mt-0.5", isLight ? "text-primary/60" : "text-blue-400/60")}>
                  {station.frequency} · {station.genre || 'LIVE'}
                </p>
              </div>
              {state.isPlaying && <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />}
            </button>

            {/* Controls */}
            <div className="px-4 pb-5 pt-1 flex flex-col gap-3">
              <div className="flex items-center justify-center gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(station.id); triggerHaptic('light'); }} 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-colors", 
                    isStationFavorite(station.id) ? "text-rose-500" : (isLight ? "text-black/30" : "text-white/40")
                  )}
                  title="Like Station"
                >
                  <Heart className={cn("w-5 h-5", isStationFavorite(station.id) && "fill-current")} />
                </button>
                
                <div className="flex items-center gap-2">
                  <button onClick={handlePrev} className={cn("w-10 h-10 rounded-full flex items-center justify-center active:scale-90", isLight ? "text-black/30" : "text-white/70")}>
                    <SkipBack className="w-5 h-5 fill-current" />
                  </button>
                  <button
                    onClick={handleTogglePlay}
                    className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl active:scale-90 bg-white text-black border border-black/10"
                  >
                    {state.isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                  </button>
                  <button onClick={handleNext} className={cn("w-10 h-10 rounded-full flex items-center justify-center active:scale-90", isLight ? "text-black/30" : "text-white/70")}>
                    <SkipForward className="w-5 h-5 fill-current" />
                  </button>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/radio/directory?filter=favorites'); triggerHaptic('medium'); }} 
                  className={cn("w-10 h-10 rounded-full flex items-center justify-center active:scale-90", isLight ? "text-black/30" : "text-white/40")}
                  title="Liked Stations"
                >
                  <Star className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-6 pt-1 border-t border-white/5">
                <button 
                  onClick={(e) => { e.stopPropagation(); shuffleAndPlay(); triggerHaptic('medium'); }} 
                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full active:scale-90 transition-all", state.isShuffle ? "text-primary bg-primary/10" : (isLight ? "text-black/40 hover:bg-black/[0.03]" : "text-white/40 hover:bg-white/5"))}
                  title="Shuffle All"
                >
                  <Shuffle className={cn("w-4 h-4", state.isShuffle && "animate-spin-slow")} />
                  <span className="text-[9px] font-black uppercase tracking-widest italic">Shuffle</span>
                </button>

                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/radio/directory'); triggerHaptic('medium'); }} 
                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full active:scale-90 transition-all", isLight ? "text-black/40 hover:bg-black/[0.03]" : "text-white/40 hover:bg-white/5")}
                  title="All Stations"
                >
                  <Radio className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest italic">Directory</span>
                </button>
              </div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

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

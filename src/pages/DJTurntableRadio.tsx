import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRadio } from '@/contexts/RadioContext';
import { getStationById, getStationsByCity } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { StationDrawer } from '@/components/radio/retro/StationDrawer';
import { FrequencyBand } from '@/components/radio/FrequencyBand';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import {
  ArrowLeft, Star, Heart, Smile,
  SkipBack, SkipForward, Play, Pause, Volume2, ListMusic
} from 'lucide-react';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';

/**
 * DJTurntableRadio — Clean FM Tuner interface (Apple-inspired redesign).
 * Horizontal touch-draggable frequency band, large frequency display,
 * premium controls.
 */
export default function DJTurntableRadio() {
  const navigate = useNavigate();
  const {
    state, play, togglePlayPause, togglePower, changeStation,
    setCity, setVolume, toggleFavorite, isStationFavorite,
  } = useRadio();
  const { isDark } = useAppTheme();

  const [showDrawer, setShowDrawer] = useState(false);
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState(false);

  // POWER ON / INITIALIZATION GUARD
  const hasInitRef = useRef(false);
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;
    if (!state.isPoweredOn) { togglePower(); triggerHaptic('medium'); }
    if (!state.isPlaying) play();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlayPause(); break;
        case 'ArrowRight': changeStation('next'); break;
        case 'ArrowLeft': changeStation('prev'); break;
        case 'ArrowUp': setVolume(Math.min(1, state.volume + 0.05)); break;
        case 'ArrowDown': setVolume(Math.max(0, state.volume - 0.05)); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.volume, togglePlayPause, changeStation, setVolume]);

  const cityStations = useMemo(() => getStationsByCity(state.currentCity), [state.currentCity]);
  const stationFrequencies = useMemo(() => cityStations.map(s => parseFloat(s.frequency) || 93.1), [cityStations]);
  const currentFrequency = parseFloat(state.currentStation?.frequency || '93.1');

  const handleFrequencyChange = useCallback((freq: number) => {
    const station = cityStations.find(s => Math.abs(parseFloat(s.frequency) - freq) < 0.15);
    if (station && station.id !== state.currentStation?.id) {
      play(station);
    }
  }, [cityStations, state.currentStation, play]);

  const handleCitySelect = useCallback((city: CityLocation) => {
    setCity(city);
    triggerHaptic('light');
  }, [setCity]);

  const handleStationSelect = useCallback((stationId: string) => {
    const station = getStationById(stationId);
    if (station) play(station);
    triggerHaptic('medium');
    setShowDrawer(false);
    setShowFavoritesDrawer(false);
  }, [play]);

  const neumBtn = isDark
    ? 'bg-white/10 border border-white/5 backdrop-blur-md'
    : 'bg-black/5 border border-black/5 backdrop-blur-md';

  const neumBtnActive = 'active:scale-[0.94] transition-transform duration-[40ms]';

  return (
    <div 
      className={cn("relative w-full h-full flex flex-col overflow-hidden transition-colors duration-500", isDark ? "bg-[#0A0A0A]" : "bg-white")}
      id="main-radio-content"
    >
      <AtmosphericLayer variant="primary" />
      
      {/* ── Top Navigation ── */}
      <div className="w-full flex justify-between items-center px-6 pt-[calc(env(safe-area-inset-top)+20px)] relative z-20">
        <button
          onClick={() => navigate('/dashboard')}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90",
            isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/5 text-black hover:bg-black/10"
          )}
        >
          <ArrowLeft size={20} />
        </button>

        <button
          onClick={() => { navigate('/radio/directory'); triggerHaptic('medium'); }}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90",
            isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/5 text-black hover:bg-black/10"
          )}
          title="Radio Directory"
        >
          <ListMusic size={20} />
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col items-center justify-between px-4 pb-32">
        
        {/* Info cluster */}
        <div className="flex flex-col items-center text-center relative w-full mb-8">
          <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] opacity-60 flex items-center gap-2", isDark ? "text-white" : "text-black")}>
            <span className={cn("w-2 h-2 rounded-full animate-pulse", isDark ? "bg-blue-400" : "bg-primary")} />
            Live from {state.currentCity || 'Miami'}
          </p>
        </div>

        {/* Large Frequency Display */}
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[300px] relative">
          {/* Record Player Visualizer */}
          <div className="absolute inset-0 flex items-center justify-center z-0 overflow-hidden pointer-events-none">
            {/* Spinning Record */}
            <motion.div
              animate={state.isPlaying ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
              className={cn(
                "w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] rounded-full relative shadow-2xl",
                isDark ? "shadow-black/60" : "shadow-black/20"
              )}
              style={{
                background: `radial-gradient(circle, #222 30%, #111 60%, #000 100%)`,
              }}
            >
              {/* Record Grooves */}
              <div className="absolute inset-0 rounded-full border border-white/5 opacity-20" style={{ backgroundImage: 'repeating-radial-gradient(circle, transparent 0, transparent 2px, rgba(255,255,255,0.05) 3px)' }} />
              
              {/* Yellow Smiley Label */}
              <div className="absolute inset-[32%] rounded-full bg-yellow-400 flex items-center justify-center shadow-lg overflow-hidden border-2 border-black/10">
                <Smile size={64} className="text-black stroke-[2.5]" />
              </div>
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStation?.id || 'none'}
              initial={{ opacity: 0, scale: 1.1, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="text-center relative z-10"
            >
              <div className={cn('text-[82px] sm:text-[96px] font-black leading-none tracking-tight drop-shadow-[0_8px_32px_rgba(0,0,0,0.4)]', isDark ? 'text-white' : 'text-black')}>
                {state.currentStation?.frequency || '95.7'}
              </div>
              <div className={cn('text-lg font-black tracking-[0.4em] uppercase mt-1 drop-shadow-sm', isDark ? 'text-blue-400' : 'text-primary')}>
                FM
              </div>
              <div className={cn('text-sm font-black mt-4 tracking-widest uppercase opacity-90 drop-shadow-md', isDark ? 'text-white' : 'text-black')}>
                {state.currentStation?.name || 'Golden Oldies'}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Frequency Band */}
        <div className="w-full mb-6">
          <FrequencyBand
            stationFrequencies={stationFrequencies}
            currentFrequency={currentFrequency}
            onFrequencyChange={handleFrequencyChange}
            isDark={isDark}
          />
        </div>

        {/* ── Playback Controls ── */}
        <div className="flex flex-col items-center gap-8 w-full pb-20">
          
          <div className="flex items-center gap-5">
            <button
              onClick={() => { if (state.currentStation) { toggleFavorite(state.currentStation.id); triggerHaptic('success'); } }}
              className={cn('w-12 h-12 rounded-full flex items-center justify-center', neumBtn, neumBtnActive)}
            >
              <Heart
                className={cn('w-5 h-5', isStationFavorite(state.currentStation?.id || '') ? 'text-red-500' : (isDark ? 'text-white/35' : 'text-black/50'))}
                fill={isStationFavorite(state.currentStation?.id || '') ? 'currentColor' : 'none'}
              />
            </button>

            <button
              onClick={() => { changeStation('prev'); triggerHaptic('medium'); }}
              className={cn('w-14 h-14 rounded-full flex items-center justify-center', neumBtn, neumBtnActive)}
            >
              <SkipBack className={cn('w-6 h-6', isDark ? 'text-white' : 'text-black')} fill="currentColor" />
            </button>

            <button
              onClick={() => { togglePlayPause(); triggerHaptic('heavy'); }}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center relative transition-all duration-300 active:scale-90 hover:scale-105 z-20 border-2",
                isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
              )}
            >
              {state.isPlaying
                ? <Pause className="w-10 h-10" fill="currentColor" />
                : <Play className="w-10 h-10 ml-1" fill="currentColor" />
              }
              
              {/* Playback Ripple Effect */}
              {state.isPlaying && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                  className={cn("absolute inset-0 rounded-full z-[-1]", isDark ? "bg-white/20" : "bg-black/10")}
                />
              )}
            </button>

            <button
              onClick={() => { changeStation('next'); triggerHaptic('medium'); }}
              className={cn('w-14 h-14 rounded-full flex items-center justify-center', neumBtn, neumBtnActive)}
            >
              <SkipForward className={cn('w-6 h-6', isDark ? 'text-white' : 'text-black')} fill="currentColor" />
            </button>

            <button
              onClick={() => { setShowFavoritesDrawer(true); triggerHaptic('medium'); }}
              className={cn('w-12 h-12 rounded-full flex items-center justify-center relative', neumBtn, neumBtnActive)}
            >
              <Star className={cn('w-5 h-5', isDark ? 'text-white/35' : 'text-black/50')} />
              {state.favorites.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          </div>

          <div className="w-full px-10">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2 opacity-40">
                <Volume2 size={12} className={isDark ? 'text-white' : 'text-black'} />
                <span className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? 'text-white' : 'text-black')}>Volume</span>
              </div>
              <span className={cn("text-[10px] font-black tabular-nums tracking-wider", isDark ? 'text-blue-400' : 'text-primary')}>
                {Math.round(state.volume * 100)}%
              </span>
            </div>
            <div className="relative w-full h-10 flex items-center">
              <div className={cn('absolute w-full h-[4px] rounded-full', isDark ? 'bg-white/[0.08]' : 'bg-black/[0.06]')}>
                <div
                  className="h-full rounded-full transition-none"
                  style={{
                    width: `${state.volume * 100}%`,
                    background: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)',
                  }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (Math.floor(val * 20) !== Math.floor(state.volume * 20)) triggerHaptic('light');
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label="Volume"
              />
              <div
                className={cn('absolute w-5 h-5 rounded-full pointer-events-none', isDark ? 'bg-white' : 'bg-black')}
                style={{ left: `calc(${state.volume * 100}% - 10px)` }}
              />
            </div>
          </div>
        </div>
      </div>

      <StationDrawer
        isOpen={showDrawer || showFavoritesDrawer}
        onClose={() => { setShowDrawer(false); setShowFavoritesDrawer(false); }}
        isFavoritesView={showFavoritesDrawer}
        currentCity={state.currentCity}
        currentStation={state.currentStation}
        isPlaying={state.isPlaying}
        favorites={state.favorites}
        onCitySelect={handleCitySelect}
        onStationSelect={handleStationSelect}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}

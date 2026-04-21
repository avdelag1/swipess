import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRadio } from '@/contexts/RadioContext';
import { cityThemes, getStationById, getStationsByCity, radioStations } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { StationDrawer } from '@/components/radio/retro/StationDrawer';
import { FrequencyBand } from '@/components/radio/FrequencyBand';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import {
  ArrowLeft, ListMusic, Heart, Shuffle,
  SkipBack, SkipForward, Play, Pause
} from 'lucide-react';

/**
 * DJTurntableRadio — Clean FM Tuner interface (Apple-inspired redesign).
 * Horizontal touch-draggable frequency band, large frequency display,
 * neumorphic circular controls.
 */
export default function DJTurntableRadio() {
  const navigate = useNavigate();
  const {
    state, loading, play, togglePlayPause, togglePower, changeStation,
    setCity, setVolume, toggleShuffle, toggleFavorite, isStationFavorite,
  } = useRadio();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [showDrawer, setShowDrawer] = useState(false);
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState(false);

  const cityTheme = (state.currentCity && cityThemes[state.currentCity]) ? cityThemes[state.currentCity] : cityThemes['tulum'];
  const primaryColor = cityTheme?.primaryColor || '#FF4D00';

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

  // Get all station frequencies for the current city
  const cityStations = useMemo(() => getStationsByCity(state.currentCity), [state.currentCity]);
  const stationFrequencies = useMemo(() => cityStations.map(s => parseFloat(s.frequency) || 93.1), [cityStations]);
  const currentFrequency = parseFloat(state.currentStation?.frequency || '93.1');

  const handleFrequencyChange = useCallback((freq: number) => {
    // Find station matching this frequency
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

  // Button base styles (neumorphic)
  const neumBtn = isDark
    ? 'bg-white/[0.06] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]'
    : 'bg-white border border-black/[0.06] shadow-[6px_6px_16px_rgba(0,0,0,0.08),-4px_-4px_12px_rgba(255,255,255,0.9)]';

  const neumBtnActive = 'active:scale-[0.94] transition-transform duration-[40ms]';

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col select-none",
        isDark ? "bg-[#0A0A0A]" : "bg-[#F2F2F7]"
      )}
    >
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,16px)] pb-3 z-20">
        <button
          onClick={() => window.history.length > 2 ? navigate(-1) : navigate('/client/dashboard')}
          className={cn('w-9 h-9 rounded-full flex items-center justify-center', neumBtn, neumBtnActive)}
        >
          <ArrowLeft className={cn('w-4.5 h-4.5', isDark ? 'text-white/60' : 'text-black/50')} />
        </button>

        {/* City name */}
        <div className="flex flex-col items-center">
          <span className={cn('text-[10px] tracking-[0.3em] font-semibold uppercase', isDark ? 'text-white/40' : 'text-black/35')}>
            {cityTheme.name}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#4ade80]" />
            <span className={cn('text-[8px] tracking-[0.2em] uppercase', isDark ? 'text-white/30' : 'text-black/25')}>LIVE</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { toggleShuffle(); triggerHaptic('light'); }}
            className={cn('w-9 h-9 rounded-full flex items-center justify-center', neumBtn, neumBtnActive,
              state.isShuffle && (isDark ? 'ring-1 ring-white/20' : 'ring-1 ring-black/10')
            )}
          >
            <Shuffle className={cn('w-3.5 h-3.5', state.isShuffle ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-white/30' : 'text-black/25'))} />
          </button>
          <button
            onClick={() => { setShowDrawer(true); triggerHaptic('medium'); }}
            className={cn('w-9 h-9 rounded-full flex items-center justify-center', neumBtn, neumBtnActive)}
          >
            <ListMusic className={cn('w-3.5 h-3.5', isDark ? 'text-white/50' : 'text-black/40')} />
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col items-center justify-between px-4">

        {/* Large Frequency Display */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStation?.id || 'none'}
              initial={{ opacity: 0, scale: 1.1, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <div className={cn('text-[72px] sm:text-[88px] font-extralight leading-none tracking-tight', isDark ? 'text-white' : 'text-black')}>
                {state.currentStation?.frequency || '93.1'}
              </div>
              <div className={cn('text-lg font-light tracking-[0.15em] uppercase mt-1', isDark ? 'text-white/40' : 'text-black/35')}>
                FM
              </div>
              <div className={cn('text-sm font-medium mt-4 tracking-wide', isDark ? 'text-white/60' : 'text-black/50')}>
                {state.currentStation?.name || 'Radio'}
              </div>
              <div className={cn('text-xs mt-1', isDark ? 'text-white/30' : 'text-black/25')}>
                {state.currentStation?.genre || ''}
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
        <div className="flex flex-col items-center gap-5 w-full" style={{ marginBottom: 'calc(env(safe-area-inset-bottom, 20px) + 16px)' }}>
          
          {/* Main controls row */}
          <div className="flex items-center gap-5">
            {/* Favorite */}
            <button
              onClick={() => { if (state.currentStation) { toggleFavorite(state.currentStation.id); triggerHaptic('success'); } }}
              className={cn('w-12 h-12 rounded-full flex items-center justify-center', neumBtn, neumBtnActive)}
            >
              <Heart
                className={cn('w-5 h-5', isStationFavorite(state.currentStation?.id || '') ? 'text-red-500' : (isDark ? 'text-white/35' : 'text-black/30'))}
                fill={isStationFavorite(state.currentStation?.id || '') ? 'currentColor' : 'none'}
              />
            </button>

            {/* Skip Back */}
            <button
              onClick={() => { changeStation('prev'); triggerHaptic('medium'); }}
              className={cn('w-14 h-14 rounded-full flex items-center justify-center', neumBtn, neumBtnActive)}
            >
              <SkipBack className={cn('w-6 h-6', isDark ? 'text-white/50' : 'text-black/40')} fill="currentColor" />
            </button>

            {/* Play/Pause — largest */}
            <button
              onClick={() => { togglePlayPause(); triggerHaptic('heavy'); }}
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center relative',
                neumBtnActive,
                isDark
                  ? 'bg-white shadow-[0_8px_30px_rgba(255,255,255,0.15)]'
                  : 'bg-black shadow-[0_8px_30px_rgba(0,0,0,0.2)]'
              )}
            >
              {state.isPlaying
                ? <Pause className={cn('w-8 h-8', isDark ? 'text-black' : 'text-white')} fill="currentColor" />
                : <Play className={cn('w-8 h-8 ml-1', isDark ? 'text-black' : 'text-white')} fill="currentColor" />
              }
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => { changeStation('next'); triggerHaptic('medium'); }}
              className={cn('w-14 h-14 rounded-full flex items-center justify-center', neumBtn, neumBtnActive)}
            >
              <SkipForward className={cn('w-6 h-6', isDark ? 'text-white/50' : 'text-black/40')} fill="currentColor" />
            </button>

            {/* Favorites list */}
            <button
              onClick={() => { setShowFavoritesDrawer(true); triggerHaptic('medium'); }}
              className={cn('w-12 h-12 rounded-full flex items-center justify-center relative', neumBtn, neumBtnActive)}
            >
              <ListMusic className={cn('w-5 h-5', isDark ? 'text-white/35' : 'text-black/30')} />
              {state.favorites.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          </div>

          {/* Volume slider */}
          <div className="w-full px-10 pb-1">
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

      {/* Station Drawer */}
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


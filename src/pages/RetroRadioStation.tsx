import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRadio } from '@/contexts/RadioContext';
import { cityThemes, getStationsByCity } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { CassetteDisplay } from '@/components/radio/retro/CassetteDisplay';
import { NowPlayingInfo } from '@/components/radio/retro/NowPlayingInfo';
import { VolumeSlider } from '@/components/radio/retro/VolumeSlider';
import { StationDrawer } from '@/components/radio/retro/StationDrawer';
import {
  ArrowLeft,
  Heart,
  Shuffle,
  ListMusic,
  Disc3,
  Library,
} from 'lucide-react';

/**
 * RetroRadioStation — Immersive retro radio experience.
 *
 * Features:
 *   - A realistic cassette tape (visual centerpiece) with animated reels
 *   - Play / Pause / Skip controls overlaid directly on the cassette body
 *   - Label color matches the active city theme
 *   - Modern info display + station switching drawer
 *   - Premium dark aesthetic with city-themed accents
 */
export default function RetroRadioStation() {
  const navigate = useNavigate();
  const {
    state,
    error,
    togglePlayPause,
    changeStation,
    setCity,
    setVolume,
    toggleShuffle,
    toggleFavorite,
    isStationFavorite,
    play,
    setMiniPlayerMode,
  } = useRadio();

  // Reset mini player mode when entering the radio page
  useEffect(() => {
    setMiniPlayerMode('expanded');
  }, [setMiniPlayerMode]);

  const [showStationDrawer, setShowStationDrawer] = useState(false);
  const cityTheme = cityThemes[state.currentCity];
  const isFav = state.currentStation ? isStationFavorite(state.currentStation.id) : false;

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          changeStation('next');
          break;
        case 'ArrowLeft':
          changeStation('prev');
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, state.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, state.volume - 0.1));
          break;
        case 'm':
        case 'M':
          setShowStationDrawer((p) => !p);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, changeStation, setVolume, state.volume]);

  const handleCitySelect = useCallback((city: CityLocation) => {
    setCity(city);
  }, [setCity]);

  const handleStationSelect = useCallback((station: any) => {
    play(station);
  }, [play]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none">
      {/* Background — deep dark with vivid city-colour glow, no white */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, ${cityTheme.primaryColor}40 0%, transparent 55%),
            radial-gradient(ellipse at 75% 75%, ${cityTheme.secondaryColor}30 0%, transparent 55%),
            radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.8) 0%, transparent 60%),
            linear-gradient(180deg, #0d0d14 0%, #07070e 100%)
          `,
        }}
      />

      {/* Noise texture overlay for analog feel */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px',
        }}
      />

      {/* Content - viewport locked, no scrolling */}
      <div className="relative z-10 flex-1 flex flex-col items-center overflow-hidden">

        {/* Header */}
        <div className="w-full flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </motion.button>

          <div className="flex items-center gap-1.5">
            <Disc3 className="w-4 h-4 text-white/40" />
            <span className="text-white/40 text-[10px] tracking-[0.15em] uppercase font-medium">
              Radio
            </span>
          </div>

          {/* Live indicator */}
          <div className="px-3 py-1 rounded-full text-[10px]">
            <div className="flex items-center gap-1.5">
              <motion.div
                className={`w-1.5 h-1.5 rounded-full ${state.isPlaying ? 'bg-orange-500' : 'bg-white/30'}`}
                animate={state.isPlaying ? { opacity: [1, 0.3, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className={`font-medium tracking-wider ${state.isPlaying ? 'text-white/70' : 'text-white/40'}`}>
                {state.isPlaying ? 'LIVE' : 'OFF'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick actions row */}
        <div className="flex items-center justify-center gap-4 py-3 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={toggleShuffle}
            className="p-2.5 rounded-full transition-all"
            style={state.isShuffle ? {
              background: `linear-gradient(135deg, ${cityTheme.primaryColor}30, ${cityTheme.secondaryColor}20)`,
              boxShadow: `0 4px 16px ${cityTheme.primaryColor}25`,
            } : {}}
            aria-label={state.isShuffle ? 'Disable shuffle' : 'Enable shuffle'}
          >
            <Shuffle className={`w-5 h-5 ${state.isShuffle ? 'text-white' : 'text-white/50'}`} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowStationDrawer(true)}
            className="p-2.5 rounded-full transition-all"
            aria-label="Browse stations"
          >
            <ListMusic className="w-5 h-5 text-white/50" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => state.currentStation && toggleFavorite(state.currentStation.id)}
            className="p-2.5 rounded-full transition-all"
            style={isFav ? {
              background: `linear-gradient(135deg, ${cityTheme.primaryColor}30, ${cityTheme.secondaryColor}20)`,
              boxShadow: `0 4px 16px ${cityTheme.primaryColor}25`,
            } : {}}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${isFav ? 'text-white fill-white' : 'text-white/50'}`}
            />
          </motion.button>

          {/* Navigate to liked stations */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/radio/favorites')}
            className="relative p-2.5 rounded-full transition-all"
            aria-label="View liked stations"
          >
            <Library className="w-5 h-5 text-white/50" />
            {state.favorites.length > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
                style={{ background: cityTheme.primaryColor }}
              >
                {state.favorites.length > 9 ? '9+' : state.favorites.length}
              </span>
            )}
          </motion.button>
        </div>

        {/* Main Content - Cassette with integrated controls */}
        <div className="flex-1 flex flex-col items-center justify-center py-4 gap-6">
          {/* Cassette — controls are overlaid inside the component */}
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStation?.id ?? 'empty'}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              <CassetteDisplay
                isPlaying={state.isPlaying}
                stationName={state.currentStation?.name ?? 'SwipesS FM'}
                genre={state.currentStation?.genre ?? 'Radio'}
                cityTheme={cityTheme}
                width={getCassetteWidth()}
                onPlayPause={togglePlayPause}
                onPrev={() => changeStation('prev')}
                onNext={() => changeStation('next')}
                onFavorite={() => state.currentStation && toggleFavorite(state.currentStation.id)}
                isFavorite={isFav}
                onVolumeUp={() => setVolume(Math.min(1, state.volume + 0.1))}
                onVolumeDown={() => setVolume(Math.max(0, state.volume - 0.1))}
              />
            </motion.div>
          </AnimatePresence>

          {/* Now Playing Info */}
          <div className="flex-shrink-0">
            <NowPlayingInfo
              station={state.currentStation}
              isPlaying={state.isPlaying}
              cityTheme={cityTheme}
            />
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 flex-shrink-0"
              >
                <p className="text-red-400/70 text-xs text-center font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Volume Slider */}
        <div className="flex-shrink-0 px-8 py-4 w-full">
          <VolumeSlider volume={state.volume} onVolumeChange={setVolume} />
        </div>

        {/* Bottom spacer for safe area */}
        <div className="flex-shrink-0 h-8" />
      </div>

      {/* Station Drawer */}
      <StationDrawer
        isOpen={showStationDrawer}
        onClose={() => setShowStationDrawer(false)}
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

/**
 * Responsive cassette width based on viewport.
 * Height is derived from the standard cassette aspect ratio (~3:2) inside the component.
 */
function getCassetteWidth(): number {
  if (typeof window === 'undefined') return 300;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (vw < 360) return 260;
  if (vw < 480) return 300;
  if (vh < 600) return 280;
  if (vw < 768) return 320;
  return 360;
}

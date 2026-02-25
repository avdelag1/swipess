import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRadio } from '@/contexts/RadioContext';
import { cityThemes, getStationsByCity } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { VinylDisc } from '@/components/radio/retro/VinylDisc';
import { NowPlayingInfo } from '@/components/radio/retro/NowPlayingInfo';
import { VolumeSlider } from '@/components/radio/retro/VolumeSlider';
import { StationDrawer } from '@/components/radio/retro/StationDrawer';
import {
  ArrowLeft,
  Heart,
  Shuffle,
  ListMusic,
  Disc3,
  SkipBack,
  SkipForward,
  Play,
  Pause,
} from 'lucide-react';

/**
 * RetroRadioStation — Immersive retro radio experience.
 *
 * Hybrid design combining:
 *   - A realistic spinning vinyl record (visual centerpiece)
 *   - An iPod Classic click wheel (physical-feeling controls)
 *   - Modern info display + station switching drawer
 *   - Premium dark aesthetic with city-themed accents
 *
 * This replaces the previous RadioPlayer page.
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
  } = useRadio();

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
      {/* Background - vibrant gradient based on city theme */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, ${cityTheme.primaryColor}35 0%, transparent 70%),
            radial-gradient(ellipse at 80% 80%, ${cityTheme.secondaryColor}25 0%, transparent 60%),
            linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)
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
        </div>

        {/* Main Content - Centered Vinyl with Controls */}
        <div className="flex-1 flex flex-col items-center justify-center py-6 gap-8">
          {/* Vinyl Record - Large and Centered */}
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStation?.id ?? 'empty'}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              <VinylDisc
                isPlaying={state.isPlaying}
                stationName={state.currentStation?.name ?? 'SwipesS'}
                genre={state.currentStation?.genre ?? 'Radio'}
                cityTheme={cityTheme}
                size={getVinylSize()}
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

          {/* Minimalist Control Buttons */}
          <div className="flex items-center justify-center gap-6">
            {/* Previous Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => changeStation('prev')}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
              style={{
                background: `linear-gradient(135deg, ${cityTheme.primaryColor}25, ${cityTheme.secondaryColor}20)`,
                backdropFilter: 'blur(10px)',
                boxShadow: `0 4px 20px ${cityTheme.primaryColor}30`,
              }}
              aria-label="Previous station"
            >
              <SkipBack className="w-6 h-6 text-white" fill="white" />
            </motion.button>

            {/* Play/Pause Button - Larger and Centered */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              onClick={togglePlayPause}
              className="w-24 h-24 rounded-full flex items-center justify-center transition-all"
              style={{
                background: `linear-gradient(135deg, ${cityTheme.primaryColor}, ${cityTheme.secondaryColor})`,
                boxShadow: `0 8px 32px ${cityTheme.primaryColor}50, 0 0 60px ${cityTheme.primaryColor}35`,
              }}
              aria-label={state.isPlaying ? 'Pause' : 'Play'}
            >
              {state.isPlaying ? (
                <Pause className="w-9 h-9 text-white" fill="white" />
              ) : (
                <Play className="w-9 h-9 text-white ml-1" fill="white" />
              )}
            </motion.button>

            {/* Next Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => changeStation('next')}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
              style={{
                background: `linear-gradient(135deg, ${cityTheme.primaryColor}25, ${cityTheme.secondaryColor}20)`,
                backdropFilter: 'blur(10px)',
                boxShadow: `0 4px 20px ${cityTheme.primaryColor}30`,
              }}
              aria-label="Next station"
            >
              <SkipForward className="w-6 h-6 text-white" fill="white" />
            </motion.button>
          </div>
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
 * Responsive vinyl size based on viewport - larger for centered design
 */
function getVinylSize(): number {
  if (typeof window === 'undefined') return 140;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (vw < 380) return 100;
  if (vw < 480) return 120;
  if (vh < 600) return 100;
  if (vw < 768) return 140;
  return 180;
}

// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { cityThemes, getStationsByCity } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { VinylDisc } from '@/components/radio/retro/VinylDisc';
import { ClickWheel } from '@/components/radio/retro/ClickWheel';
import { NowPlayingInfo } from '@/components/radio/retro/NowPlayingInfo';
import { VolumeSlider } from '@/components/radio/retro/VolumeSlider';
import { StationDrawer } from '@/components/radio/retro/StationDrawer';
import {
  ArrowLeft,
  Heart,
  Shuffle,
  ListMusic,
  Disc3,
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
    <div className="fixed inset-0 flex flex-col overflow-hidden select-none">
      {/* Background - subtle gradient based on city theme */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `
            radial-gradient(ellipse at 50% 20%, ${cityTheme.primaryColor}15 0%, transparent 60%),
            radial-gradient(ellipse at 80% 80%, ${cityTheme.secondaryColor}10 0%, transparent 50%),
            linear-gradient(180deg, #0a0a0a 0%, #050505 100%)
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
        <div className="w-full flex items-center justify-between px-5 pt-8 pb-1 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center backdrop-blur-sm"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </motion.button>

          <div className="flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-white/30" />
            <span className="text-white/30 text-xs tracking-[0.2em] uppercase font-medium">
              Radio
            </span>
          </div>

          {/* Live indicator */}
          <div className={`px-3 py-1.5 rounded-full ${state.isPlaying ? 'bg-orange-500/10' : 'bg-white/5'}`}>
            <div className="flex items-center gap-1.5">
              <motion.div
                className={`w-1.5 h-1.5 rounded-full ${state.isPlaying ? 'bg-orange-500' : 'bg-white/20'}`}
                animate={state.isPlaying ? { opacity: [1, 0.3, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className={`text-[10px] font-medium tracking-wider ${state.isPlaying ? 'text-white/60' : 'text-white/30'}`}>
                {state.isPlaying ? 'LIVE' : 'OFF'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick actions row */}
        <div className="flex items-center justify-center gap-3 py-2 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleShuffle}
            className={`p-2.5 rounded-full transition-colors ${state.isShuffle ? 'bg-orange-500/15' : 'bg-white/5'}`}
            aria-label={state.isShuffle ? 'Disable shuffle' : 'Enable shuffle'}
          >
            <Shuffle className={`w-4 h-4 ${state.isShuffle ? 'text-orange-400' : 'text-white/30'}`} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowStationDrawer(true)}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Browse stations"
          >
            <ListMusic className="w-4 h-4 text-white/30" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => state.currentStation && toggleFavorite(state.currentStation.id)}
            className={`p-2.5 rounded-full transition-colors ${isFav ? 'bg-orange-500/15' : 'bg-white/5'}`}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${isFav ? 'text-orange-400 fill-orange-400' : 'text-white/30'}`}
            />
          </motion.button>
        </div>

        {/* Vinyl Record - the hero */}
        <div className="flex-shrink-0 py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStation?.id ?? 'empty'}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
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
        </div>

        {/* Now Playing Info */}
        <div className="flex-shrink-0 pb-2">
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
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-2 flex-shrink-0"
            >
              <p className="text-red-400/60 text-xs text-center">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* iPod Click Wheel */}
        <div className="flex-shrink-0 py-1">
          <ClickWheel
            isPlaying={state.isPlaying}
            onPlayPause={togglePlayPause}
            onPrevious={() => changeStation('prev')}
            onNext={() => changeStation('next')}
            onMenuPress={() => setShowStationDrawer(true)}
            variant="dark"
            size={getWheelSize()}
          />
        </div>

        {/* Volume Slider */}
        <div className="flex-shrink-0 px-8 pb-2 w-full">
          <VolumeSlider volume={state.volume} onVolumeChange={setVolume} />
        </div>

        {/* City quick-switch pills */}
        <div className="flex-shrink-0 px-5 pb-4 w-full">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide justify-center flex-wrap">
            {(Object.keys(cityThemes) as CityLocation[]).map((city) => {
              const ct = cityThemes[city];
              const isActive = city === state.currentCity;
              return (
                <motion.button
                  key={city}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleCitySelect(city)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                    isActive
                      ? 'text-white'
                      : 'bg-white/5 text-white/35 hover:bg-white/10 hover:text-white/50'
                  }`}
                  style={isActive ? {
                    background: `linear-gradient(135deg, ${ct.primaryColor}60, ${ct.secondaryColor}40)`,
                    boxShadow: `0 0 12px ${ct.primaryColor}30`,
                  } : undefined}
                >
                  {ct.name}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Bottom spacer for safe area */}
        <div className="flex-shrink-0 h-2" />
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
 * Responsive vinyl size based on viewport
 */
function getVinylSize(): number {
  if (typeof window === 'undefined') return 200;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Mobile portrait
  if (vw < 380) return 180;
  if (vw < 480) return 200;
  // Mobile landscape or small tablet
  if (vh < 600) return 160;
  // Tablet
  if (vw < 768) return 220;
  // Desktop
  return 260;
}

/**
 * Responsive click wheel size
 */
function getWheelSize(): number {
  if (typeof window === 'undefined') return 160;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (vw < 380) return 140;
  if (vw < 480) return 155;
  if (vh < 600) return 130;
  if (vw < 768) return 165;
  return 180;
}

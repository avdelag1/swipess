// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRadio } from '@/contexts/RadioContext';
import { cityThemes, getStationsByCity } from '@/data/radioStations';
import { StationCascade } from '@/components/radio/StationCascade';
import { ArrowLeft, Volume2, VolumeX, Shuffle, Radio } from 'lucide-react';

/**
 * Improved Radio Player with accessible station navigation
 * - Station cascade selector for easy access
 * - Controls positioned ergonomically
 * - Background playback supported
 */
export default function ImprovedRadioPlayer() {
  const navigate = useNavigate();
  const {
    state,
    togglePlayPause,
    changeStation,
    setVolume,
    toggleShuffle,
  } = useRadio();

  const [showStationSelector, setShowStationSelector] = useState(false);
  const [volumeSliderOpen, setVolumeSliderOpen] = useState(false);
  const cityTheme = cityThemes[state.currentCity];

  // Keyboard shortcuts
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
        case 's':
        case 'S':
          setShowStationSelector(true);
          break;
        case 'm':
        case 'M':
          setVolumeSliderOpen(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, changeStation]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Background with city theme */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, ${cityTheme.primaryColor}40 0%, transparent 70%),
            radial-gradient(ellipse at 80% 80%, ${cityTheme.secondaryColor}30 0%, transparent 60%),
            linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)
          `,
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-orange-500" />
          <span className="text-white font-semibold">Radio</span>
        </div>

        <button
          onClick={() => setVolumeSliderOpen(prev => !prev)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          {state.volume === 0 ? (
            <VolumeX className="w-5 h-5 text-white/70" />
          ) : (
            <Volume2 className="w-5 h-5 text-white/70" />
          )}
        </button>
      </div>

      {/* Main Content - Vinyl Disc */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <motion.div
          animate={{ 
            rotate: state.isPlaying ? 360 : 0 
          }}
          transition={{ 
            duration: state.isPlaying ? 20 : 0.5,
            repeat: state.isPlaying ? Infinity : 0,
            ease: "linear"
          }}
          className="relative"
        >
          {/* Vinyl record */}
          <div className="w-64 h-64 rounded-full bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] border-8 border-[#333] flex items-center justify-center shadow-2xl">
            {/* Grooves */}
            <div className="absolute inset-4 rounded-full border border-white/5" />
            <div className="absolute inset-8 rounded-full border border-white/5" />
            <div className="absolute inset-12 rounded-full border border-white/5" />
            
            {/* Label */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-inner">
              {state.currentStation?.logo ? (
                <img 
                  src={state.currentStation.logo} 
                  alt={state.currentStation?.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <Radio className="w-10 h-10 text-white" />
              )}
            </div>
          </div>

          {/* Playing indicator */}
          {state.isPlaying && (
            <motion.div
              className="absolute -inset-4 rounded-full border-2 border-orange-500/50"
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>

      {/* Station Info */}
      <div className="relative z-10 px-6 py-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-1">
          {state.currentStation?.name || 'Select a Station'}
        </h2>
        <p className="text-white/60 text-sm">
          {state.currentStation?.genre} • {state.currentStation?.bitrate}kbps
        </p>
        {state.isPlaying && (
          <motion.div
            className="flex items-center justify-center gap-1 mt-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="w-2 h-2 bg-orange-500 rounded-full" />
            <span className="w-2 h-2 bg-orange-500 rounded-full" style={{ animationDelay: '0.2s' }} />
            <span className="w-2 h-2 bg-orange-500 rounded-full" style={{ animationDelay: '0.4s' }} />
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-10 px-8 py-6">
        <div className="flex items-center justify-center gap-6">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              state.isShuffle 
                ? 'bg-orange-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous */}
          <button
            onClick={() => changeStation('prev')}
            className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
          >
            <div className="flex items-center">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-white border-b-[8px] border-b-transparent" />
              <div className="w-1 h-4 bg-white mx-0.5" />
            </div>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all active:scale-95"
          >
            {state.isPlaying ? (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-6 bg-white rounded-sm" />
                <div className="w-1.5 h-6 bg-white rounded-sm" />
              </div>
            ) : (
              <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={() => changeStation('next')}
            className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
          >
            <div className="flex items-center">
              <div className="w-1 h-4 bg-white mx-0.5" />
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent" />
            </div>
          </button>

          {/* Station Selector */}
          <button
            onClick={() => setShowStationSelector(true)}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <Radio className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </div>

      {/* Volume Slider (collapsible) */}
      <AnimatePresence>
        {volumeSliderOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative z-10 px-8 pb-4"
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-lg"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>0%</span>
              <span>{Math.round(state.volume * 100)}%</span>
              <span>100%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Station Selector Cascade */}
      <StationCascade
        isOpen={showStationSelector}
        onClose={() => setShowStationSelector(false)}
      />

      {/* Instructions hint */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/30">
        Press 'S' to select station • Arrow keys to navigate
      </div>
    </div>
  );
}

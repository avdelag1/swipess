import { motion } from 'framer-motion';
import { Shuffle, Star, Plus, Volume2, VolumeX, SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import { RadioStation, CityLocation } from '@/types/radio';
import { cityThemes } from '@/data/radioStations';

interface IPodSkinProps {
  station: RadioStation | null;
  isPlaying: boolean;
  isShuffle: boolean;
  isFavorite: boolean;
  currentCity: CityLocation;
  volume: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleFavorite: () => void;
  onCityChange: () => void;
  onVolumeChange: (volume: number) => void;
  onAddToPlaylist?: () => void;
}

export function IPodSkin({
  station,
  isPlaying,
  isShuffle,
  isFavorite,
  currentCity,
  volume,
  onPlayPause,
  onPrevious,
  onNext,
  onToggleShuffle,
  onToggleFavorite,
  onCityChange,
  onVolumeChange,
  onAddToPlaylist
}: IPodSkinProps) {
  const cityTheme = cityThemes[currentCity];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-gray-400 flex items-center justify-center p-6">
      {/* iPod Body */}
      <div className="w-80 bg-gradient-to-b from-gray-100 to-gray-300 rounded-[2rem] p-6 shadow-2xl relative">
        {/* Chrome bezel */}
        <div className="absolute inset-0 rounded-[2rem] border-4 border-gray-400/50 pointer-events-none" />

        {/* Screen */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-inner mb-6">
          {/* Screen Header */}
          <div className="bg-gradient-to-b from-blue-600 to-blue-700 px-3 py-2 flex items-center justify-between">
            <span className="text-white text-xs font-medium">Now Playing</span>
            <div className="flex items-center gap-2">
              {isShuffle && (
                <Shuffle className="w-3 h-3 text-white/80" />
              )}
              <div className="flex items-center gap-0.5">
                {volume === 0 ? (
                  <VolumeX className="w-3 h-3 text-white/80" />
                ) : (
                  <>
                    <Volume2 className="w-3 h-3 text-white/80" />
                    <div className="flex gap-0.5">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-2 rounded-sm ${
                            i < Math.ceil(volume * 4) ? 'bg-white' : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Screen Content */}
          <div className="p-4 min-h-[180px] flex flex-col items-center justify-center">
            {station ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center w-full"
              >
                {/* Album Art Placeholder */}
                <div
                  className="w-24 h-24 mx-auto rounded-lg mb-3 flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${cityTheme.primaryColor}, ${cityTheme.secondaryColor})`
                  }}
                >
                  {station.albumArt ? (
                    <img
                      src={station.albumArt}
                      alt={station.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-white text-2xl font-bold">
                      {station.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Station Info */}
                <div className="text-white font-semibold text-sm truncate">
                  {station.name}
                </div>
                <div className="text-gray-400 text-xs truncate mt-1">
                  {cityTheme.name} - {station.genre}
                </div>
                <div className="text-gray-500 text-[10px] mt-1">
                  {station.frequency}
                </div>

                {/* Progress bar simulation */}
                <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
                  {isPlaying && (
                    <motion.div
                      className="h-full bg-blue-500"
                      animate={{ width: ['0%', '100%'] }}
                      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="text-gray-500 text-sm">No Station Selected</div>
            )}
          </div>
        </div>

        {/* Click Wheel */}
        <div className="relative w-48 h-48 mx-auto">
          {/* Outer wheel */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-300 to-gray-400 shadow-lg">
            {/* Touch areas */}
            {/* Menu - Top */}
            <motion.button
              whileTap={{ scale: 0.95, backgroundColor: 'rgba(0,0,0,0.1)' }}
              onClick={onCityChange}
              className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-8 flex items-center justify-center rounded-t-full"
              aria-label="Change city"
            >
              <span className="text-[10px] font-bold text-gray-700 uppercase">MENU</span>
            </motion.button>

            {/* Previous - Left */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-12 flex items-center justify-center"
              aria-label="Previous"
            >
              <SkipBack size={16} className="text-gray-700" />
            </motion.button>

            {/* Next - Right */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-12 flex items-center justify-center"
              aria-label="Next"
            >
              <SkipForward size={16} className="text-gray-700" />
            </motion.button>

            {/* Play/Pause - Bottom */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onPlayPause}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-8 flex items-center justify-center"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={14} className="text-gray-700" />
              ) : (
                <Play size={14} className="text-gray-700" />
              )}
            </motion.button>
          </div>

          {/* Center Select Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onPlayPause}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-b from-gray-200 to-gray-400 shadow-lg flex items-center justify-center"
            aria-label="Select"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-b from-gray-100 to-gray-300 shadow-inner" />
          </motion.button>
        </div>

        {/* Bottom controls row */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggleShuffle}
            className={`p-2 rounded-full ${isShuffle ? 'bg-blue-500' : 'bg-gray-400'} transition-colors`}
            aria-label="Toggle shuffle"
          >
            <Shuffle className="w-4 h-4 text-white" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggleFavorite}
            className={`p-2 rounded-full ${isFavorite ? 'bg-red-500' : 'bg-gray-400'} transition-colors`}
            aria-label="Toggle favorite"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'text-white fill-white' : 'text-white'}`} />
          </motion.button>

          {onAddToPlaylist && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onAddToPlaylist}
              className="p-2 rounded-full bg-gray-400 transition-colors"
              aria-label="Add to playlist"
            >
              <Plus className="w-4 h-4 text-white" />
            </motion.button>
          )}

          {/* Volume control */}
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onVolumeChange(Math.max(0, volume - 0.1))}
              className="p-1"
            >
              <VolumeX className="w-4 h-4 text-gray-600" />
            </motion.button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-gray-400 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gray-600
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-3
                [&::-moz-range-thumb]:h-3
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-gray-600
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
              aria-label="Volume"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onVolumeChange(Math.min(1, volume + 0.1))}
              className="p-1"
            >
              <Volume2 className="w-4 h-4 text-gray-600" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

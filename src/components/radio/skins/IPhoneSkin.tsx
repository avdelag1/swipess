import { motion } from 'framer-motion';
import { Shuffle, Star, Globe, Plus, Volume2, VolumeX } from 'lucide-react';
import { FrequencyDial } from '../FrequencyDial';
import { PlayerControls } from '../PlayerControls';
import { RadioStation, CityLocation } from '@/types/radio';
import { cityThemes } from '@/data/radioStations';

interface IPhoneSkinProps {
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
  theme?: 'light' | 'dark' | 'vibrant';
}

export function IPhoneSkin({
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
  onAddToPlaylist,
  theme = 'light'
}: IPhoneSkinProps) {
  const cityTheme = cityThemes[currentCity];

  // Theme-specific colors
  const bgColors = {
    light: 'bg-gradient-to-br from-gray-50 to-gray-100',
    dark: 'bg-gradient-to-br from-gray-900 to-black',
    vibrant: `bg-gradient-to-br ${cityTheme?.gradient || 'from-purple-500 to-pink-500'}`
  };

  const cardBg = {
    light: 'bg-white/90 backdrop-blur-lg',
    dark: 'bg-black/40 backdrop-blur-lg',
    vibrant: 'bg-black/30 backdrop-blur-lg'
  };

  const textColor = {
    light: 'text-gray-900',
    dark: 'text-white',
    vibrant: 'text-white'
  };

  const secondaryText = {
    light: 'text-gray-600',
    dark: 'text-gray-300',
    vibrant: 'text-white/80'
  };

  const iconColor = {
    light: 'text-gray-700',
    dark: 'text-white',
    vibrant: 'text-white'
  };

  return (
    <div className={`min-h-screen ${bgColors[theme]} flex flex-col items-center justify-between p-6 relative overflow-hidden`}>
      {/* Background Animation */}
      {isPlaying && (
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            background: [
              `radial-gradient(circle at 20% 50%, ${cityTheme.primaryColor} 0%, transparent 50%)`,
              `radial-gradient(circle at 80% 50%, ${cityTheme.secondaryColor} 0%, transparent 50%)`,
              `radial-gradient(circle at 20% 50%, ${cityTheme.primaryColor} 0%, transparent 50%)`
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Top Icons */}
      <div className="w-full max-w-md flex justify-between items-center z-10">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onToggleShuffle}
          className={`p-2 rounded-full ${isShuffle ? 'bg-white/20' : 'bg-transparent'} transition-colors`}
          aria-label="Toggle shuffle"
        >
          <Shuffle className={`w-5 h-5 ${isShuffle ? 'text-green-400' : iconColor[theme]}`} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onToggleFavorite}
          className={`p-2 rounded-full ${isFavorite ? 'bg-red-500/20' : 'bg-transparent'} transition-colors`}
          aria-label="Toggle favorite"
        >
          <Star
            className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : iconColor[theme]}`}
          />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCityChange}
          className="p-2 rounded-full bg-transparent transition-colors relative"
          aria-label="Change city"
        >
          <Globe className={`w-5 h-5 ${iconColor[theme]}`} />
          <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-medium ${textColor[theme]}`}>
            {cityTheme.name.slice(0, 3).toUpperCase()}
          </span>
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-8 z-10">
        {/* Frequency Dial */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FrequencyDial
            frequency={station?.frequency || '101.9 FM'}
            stationName={station?.name || 'No Station'}
            theme={theme === 'light' ? 'light' : 'dark'}
          />
        </motion.div>

        {/* Album Art Card */}
        {station && (
          <motion.div
            className={`w-64 h-64 rounded-3xl ${cardBg[theme]} shadow-2xl relative overflow-hidden`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            {/* Album Art / Station Logo */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              {station.albumArt ? (
                <img
                  src={station.albumArt}
                  alt={station.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6">
                  <div className={`text-6xl font-bold ${textColor[theme]} mb-2`}>
                    {station.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={`text-sm ${secondaryText[theme]}`}>
                    {station.genre}
                  </div>
                </div>
              )}

              {/* Playing Animation Overlay */}
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>

            {/* Song/Show Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="text-white font-semibold text-sm truncate">
                {station.description || 'Now Playing'}
              </div>
              <div className="text-white/70 text-xs truncate flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-medium">
                  {cityTheme.name}
                </span>
                <span>{station.genre}</span>
              </div>
            </div>

            {/* Add to Playlist Button */}
            {onAddToPlaylist && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onAddToPlaylist}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                aria-label="Add to playlist"
              >
                <Plus className="w-5 h-5 text-white" />
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Progress Bar */}
        <div className="w-full max-w-xs">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            {isPlaying && (
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-pink-500"
                animate={{
                  width: ['0%', '100%'],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            )}
          </div>
        </div>

        {/* Volume Control */}
        <div className="w-full max-w-xs flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onVolumeChange(volume === 0 ? 0.7 : 0)}
            className="p-1"
          >
            {volume === 0 ? (
              <VolumeX className={`w-5 h-5 ${iconColor[theme]}`} />
            ) : (
              <Volume2 className={`w-5 h-5 ${iconColor[theme]}`} />
            )}
          </motion.button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer"
            aria-label="Volume"
          />
          <span className={`text-xs font-medium ${secondaryText[theme]} w-8`}>
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md z-10">
        <PlayerControls
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onPrevious={onPrevious}
          onNext={onNext}
          theme={theme === 'light' ? 'light' : 'dark'}
          size="lg"
        />
      </div>
    </div>
  );
}

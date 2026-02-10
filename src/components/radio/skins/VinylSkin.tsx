import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Disc3, Volume2 } from 'lucide-react';
import { RadioStation, CityLocation } from '@/types/radio';
import { cityThemes } from '@/data/radioStations';
import { useRef, useState } from 'react';

interface VinylSkinProps {
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
  onCitySelect: (city: CityLocation) => void;
  onVolumeChange: (volume: number) => void;
}

const CITY_GROUPS: CityLocation[] = ['miami', 'ibiza', 'california', 'texas', 'new-york', 'tulum', 'french', 'podcasts'];

export function VinylSkin({
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
  onCitySelect,
  onVolumeChange
}: VinylSkinProps) {
  const volumeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleVolumeInteraction = (clientX: number) => {
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const width = rect.width;
    const offsetX = clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, offsetX / width));
    onVolumeChange(newVolume);
  };

  const handleVolumeStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    handleVolumeInteraction(clientX);
  };

  const handleVolumeMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    handleVolumeInteraction(clientX);
  };

  const handleVolumeEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900">
      {/* Top Icons */}
      <div className="w-full flex justify-between items-start mb-2 z-10">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onToggleShuffle}
          className={`p-2 rounded-full ${isShuffle ? 'bg-amber-500/20' : 'bg-white/10'} backdrop-blur-sm transition-colors`}
        >
          <Shuffle className={`w-4 h-4 ${isShuffle ? 'text-amber-400' : 'text-white/70'}`} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onToggleFavorite}
          className={`p-2 rounded-full ${isFavorite ? 'bg-red-500/20' : 'bg-white/10'} backdrop-blur-sm transition-colors`}
        >
          <Heart
            className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-white/70'}`}
          />
        </motion.button>
      </div>

      {/* Vinyl Record - Compact size */}
      <div className="relative z-10">
        <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 shadow-xl flex items-center justify-center relative">
          <motion.div
            className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full bg-gradient-to-br from-gray-900 to-black shadow-inner flex items-center justify-center relative overflow-hidden"
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-white/5"
                style={{
                  width: `${250 - i * 35}px`,
                  height: `${250 - i * 35}px`,
                }}
              />
            ))}
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 shadow-lg flex items-center justify-center">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gray-900 shadow-inner z-10" />
            </div>
          </motion.div>
          <div className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-700 shadow-lg z-20" />
          <motion.div
            className="absolute -right-2 -top-2 z-30"
            initial={{ rotate: -45 }}
            animate={{ rotate: isPlaying ? -25 : -45 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 shadow-lg flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-gray-800" />
            </div>
            <div className="absolute top-2 left-2 w-24 h-1.5 bg-gradient-to-r from-gray-500 via-gray-400 to-gray-300 rounded-full" />
          </motion.div>
        </div>

        {station && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-black/40 backdrop-blur-lg rounded-xl p-3 text-center border border-white/10"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Disc3 className="w-3 h-3 text-amber-400" />
              <div className="text-amber-400 text-xs font-medium">
                {isPlaying ? 'NOW SPINNING' : 'PAUSED'}
              </div>
            </div>
            <div className="text-white text-base font-bold">{station.name}</div>
            <div className="text-white/60 text-xs">{station.frequency}</div>
          </motion.div>
        )}
      </div>

      {/* City Toggle - Compact */}
      <div className="mt-3 flex flex-wrap justify-center gap-1 z-10 max-w-xs">
        {CITY_GROUPS.map((city) => (
          <motion.button
            key={city}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCitySelect(city)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              currentCity === city
                ? 'bg-amber-500 text-gray-900'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {cityThemes[city].name}
          </motion.button>
        ))}
      </div>

      {/* Controls - Compact */}
      <div className="mt-4 flex items-center justify-center gap-4 z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onPrevious}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
        >
          <SkipBack className="w-5 h-5 text-white" fill="currentColor" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onPlayPause}
          className="p-4 rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-gray-900" fill="currentColor" />
          ) : (
            <Play className="w-6 h-6 text-gray-900 ml-0.5" fill="currentColor" />
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onNext}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
        >
          <SkipForward className="w-5 h-5 text-white" fill="currentColor" />
        </motion.button>
      </div>

      {/* Volume - Compact */}
      <div className="mt-3 flex items-center gap-2 z-10">
        <Volume2 className="w-4 h-4 text-white/70" />
        <div
          ref={volumeRef}
          className="w-32 h-2.5 bg-white/10 rounded-full relative cursor-pointer touch-none"
          onMouseDown={handleVolumeStart}
          onMouseMove={handleVolumeMove}
          onMouseUp={handleVolumeEnd}
          onMouseLeave={handleVolumeEnd}
          onTouchStart={handleVolumeStart}
          onTouchMove={handleVolumeMove}
          onTouchEnd={handleVolumeEnd}
        >
          <motion.div
            className="absolute left-0 top-0 h-full bg-amber-500 rounded-full"
            style={{ width: `${volume * 100}%` }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
            style={{ left: `calc(${volume * 100}% - 8px)` }}
          />
        </div>
        <span className="text-white/60 text-xs w-8">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Volume2 } from 'lucide-react';
import { RadioStation, CityLocation } from '@/types/radio';
import { cityThemes } from '@/data/radioStations';
import { useRef, useState } from 'react';

interface RetroSkinProps {
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

export function RetroSkin({
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
}: RetroSkinProps) {
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
    <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
      {/* Compact Boombox */}
      <div className="relative">
        <div className="w-72 sm:w-80 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 shadow-xl border-4 border-gray-700">
          {/* Handle */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-32 h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-t-full border-4 border-gray-700" />

          {/* Compact Speakers */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1 aspect-square bg-gray-900 rounded-xl p-2 border-2 border-gray-700">
              <div className="w-full h-full grid grid-cols-4 gap-0.5">
                {[...Array(16)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="bg-gray-700 rounded-full"
                    animate={{
                      scale: isPlaying ? [1, 1.15, 1] : 1,
                    }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.02,
                      repeat: isPlaying ? Infinity : 0,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 aspect-square bg-gray-900 rounded-xl p-2 border-2 border-gray-700">
              <div className="w-full h-full grid grid-cols-4 gap-0.5">
                {[...Array(16)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="bg-gray-700 rounded-full"
                    animate={{
                      scale: isPlaying ? [1, 1.15, 1] : 1,
                    }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.02,
                      repeat: isPlaying ? Infinity : 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Cassette Display - Compact */}
          <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-3 mb-3 border-2 border-gray-600">
            <div className="flex justify-between items-center mb-2">
              <motion.div
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
              >
                <div className="w-5 h-5 rounded-full bg-gray-700" />
              </motion.div>
              <motion.div
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
              >
                <div className="w-5 h-5 rounded-full bg-gray-700" />
              </motion.div>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <div className="text-[10px] font-mono text-gray-800">{station?.frequency || 'No Signal'}</div>
              <div className="text-xs font-bold text-gray-900 truncate">{station?.name || 'RADIO'}</div>
              <div className="text-[10px] text-gray-600">{station?.genre || '---'}</div>
            </div>
          </div>

          {/* Control Panel - Compact */}
          <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg p-3 space-y-2">
            <div className="bg-green-900 rounded px-2 py-1 font-mono text-green-400 text-[10px] text-center border border-green-800">
              {isPlaying ? '▶ PLAYING' : '⏸ PAUSED'} • {station?.city.toUpperCase() || 'OFFLINE'}
            </div>

            <div className="flex items-center justify-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onToggleShuffle}
                className={`p-1.5 rounded ${isShuffle ? 'bg-cyan-500' : 'bg-gray-800'} transition-colors`}
              >
                <Shuffle className={`w-3.5 h-3.5 ${isShuffle ? 'text-white' : 'text-gray-400'}`} />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onPrevious}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <SkipBack className="w-4 h-4 text-white" fill="currentColor" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onPlayPause}
                className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" fill="currentColor" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                )}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onNext}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <SkipForward className="w-4 h-4 text-white" fill="currentColor" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onToggleFavorite}
                className={`p-1.5 rounded ${isFavorite ? 'bg-red-500' : 'bg-gray-800'} transition-colors`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${isFavorite ? 'text-white fill-white' : 'text-gray-400'}`}
                />
              </motion.button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-gray-400" />
              <div
                ref={volumeRef}
                className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden relative cursor-pointer touch-none"
                onMouseDown={handleVolumeStart}
                onMouseMove={handleVolumeMove}
                onMouseUp={handleVolumeEnd}
                onMouseLeave={handleVolumeEnd}
                onTouchStart={handleVolumeStart}
                onTouchMove={handleVolumeMove}
                onTouchEnd={handleVolumeEnd}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-cyan-500"
                  style={{ width: `${volume * 100}%` }}
                />
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
                  style={{ left: `calc(${volume * 100}% - 6px)` }}
                />
              </div>
              <span className="text-gray-400 text-[10px] w-6">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </div>

        {/* City Toggle - Compact */}
        <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-72">
          {CITY_GROUPS.map((city) => (
            <motion.button
              key={city}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCitySelect(city)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                currentCity === city
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {cityThemes[city].name}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

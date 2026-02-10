/**
 * Radio Mini Player Bubble
 * Floating player that appears when radio is playing
 */

import { motion } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { Play, Pause, X, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function RadioMiniPlayer() {
  const { state, togglePlayPause } = useRadio();
  const navigate = useNavigate();

  // Only show when playing
  if (!state.isPlaying || !state.currentStation) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-20 right-4 z-50"
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-lg rounded-full shadow-lg border border-white/20">
        {/* Album art placeholder */}
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 animate-pulse" />
        </div>

        {/* Station info */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-medium text-white truncate max-w-[100px]">
            {state.currentStation.name}
          </span>
          <span className="text-[10px] text-white/60 truncate max-w-[100px]">
            {state.currentStation.genre}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={togglePlayPause}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
          >
            {state.isPlaying ? (
              <Pause className="w-4 h-4 text-black" fill="currentColor" />
            ) : (
              <Play className="w-4 h-4 text-black ml-0.5" fill="currentColor" />
            )}
          </button>

          <button
            onClick={() => navigate('/radio')}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            <Volume2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

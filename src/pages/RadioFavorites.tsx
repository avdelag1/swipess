import { motion } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { getStationById } from '@/data/radioStations';
import { ArrowLeft, Heart, Shuffle, Play, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function RadioFavoritesPage() {
  const navigate = useNavigate();
  const { state, play, toggleShuffle, toggleFavorite } = useRadio();

  const handleShufflePlay = () => {
    if (state.favorites.length === 0) return;
    if (!state.isShuffle) toggleShuffle();
    const randomId = state.favorites[Math.floor(Math.random() * state.favorites.length)];
    const station = getStationById(randomId);
    if (station) {
      play(station);
      toast.success('Shuffle play started');
    }
  };

  const handlePlayStation = (stationId: string) => {
    const station = getStationById(stationId);
    if (station) play(station);
  };

  const handleRemoveFavorite = (stationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(stationId);
    toast.success('Removed from favorites');
  };

  const favoriteStations = state.favorites
    .map((id) => getStationById(id))
    .filter((s) => s !== undefined);

  return (
    <div className="fixed inset-0 bg-black overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-lg z-10 border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">Liked Stations</h1>
          </div>
          <button
            onClick={handleShufflePlay}
            disabled={state.favorites.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 rounded-full text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {/* Empty State */}
        {favoriteStations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Heart className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-xl font-medium mb-2">No Liked Stations</p>
            <p className="text-sm text-center max-w-xs">Heart your favorite stations while listening to add them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {favoriteStations.map((station, index) => (
              <motion.div
                key={station!.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handlePlayStation(station!.id)}
                className="group flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
              >
                {/* Station Icon */}
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                  {station!.name[0]}
                </div>

                {/* Station Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{station!.name}</h3>
                  <p className="text-sm text-white/40 truncate">{station!.genre} • {station!.frequency}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleRemoveFavorite(station!.id, e)}
                    className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/30"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlayStation(station!.id); }}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                  >
                    <Play className="w-4 h-4" fill="currentColor" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { getStationById, cityThemes } from '@/data/radioStations';
import { ArrowLeft, Heart, Shuffle, Play, Pause, X, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function RadioFavoritesPage() {
  const navigate = useNavigate();
  const { state, play, toggleShuffle, toggleFavorite, togglePlayPause } = useRadio();

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
    toast.success('Removed from liked stations');
  };

  const favoriteStations = state.favorites
    .map((id) => getStationById(id))
    .filter((s) => s !== undefined);

  const currentStationId = state.currentStation?.id;

  return (
    <div className="fixed inset-0 overflow-y-auto z-40" style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)' }}>
      {/* Subtle noise texture */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px',
        }}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b border-white/8 px-4 py-4" style={{ background: 'rgba(20,20,20,0.85)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              title="Go back"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white hover:bg-white/10 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </motion.button>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Liked Stations</h1>
              <p className="text-[11px] text-white/40 mt-0.5">
                {favoriteStations.length} {favoriteStations.length === 1 ? 'station' : 'stations'}
              </p>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShufflePlay}
            disabled={favoriteStations.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #FF4D00, #FFB347)' }}
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 pb-28">
        {/* Empty State */}
        <AnimatePresence mode="wait">
          {favoriteStations.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-white/40"
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Heart className="w-9 h-9" />
              </div>
              <p className="text-xl font-bold text-white/60 mb-2">No liked stations yet</p>
              <p className="text-sm text-center max-w-xs leading-relaxed">
                Heart your favorite stations while listening to save them here
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/radio')}
                className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <Radio className="w-4 h-4" />
                Go to Radio
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="list" className="space-y-2.5">
              {favoriteStations.map((station, index) => {
                const theme = cityThemes[station!.city];
                const isCurrentlyPlaying = currentStationId === station!.id && state.isPlaying;
                const isCurrentStation = currentStationId === station!.id;

                return (
                  <motion.div
                    key={station!.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.04, duration: 0.3 }}
                    onClick={() => handlePlayStation(station!.id)}
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
                    style={{
                      background: isCurrentStation
                        ? `linear-gradient(135deg, ${theme.primaryColor}25, ${theme.secondaryColor}12)`
                        : 'rgba(255,255,255,0.05)',
                      border: isCurrentStation
                        ? `1px solid ${theme.primaryColor}40`
                        : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {/* Station Icon */}
                    <div
                      className="relative w-13 h-13 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0"
                      style={{
                        width: 52,
                        height: 52,
                        background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                        boxShadow: isCurrentStation ? `0 4px 20px ${theme.primaryColor}50` : '0 2px 8px rgba(0,0,0,0.4)',
                      }}
                    >
                      {station!.name[0]}

                      {/* Equalizer animation for playing station */}
                      {isCurrentlyPlaying && (
                        <div className="absolute inset-0 flex items-end justify-center gap-0.5 pb-1 rounded-xl overflow-hidden bg-black/30">
                          {[1, 2, 3].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1 rounded-full bg-white"
                              animate={{ height: ['40%', '80%', '40%'] }}
                              transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Station Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white truncate text-sm">{station!.name}</h3>
                        {isCurrentStation && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: `${theme.primaryColor}30`, color: theme.primaryColor }}
                          >
                            {isCurrentlyPlaying ? 'LIVE' : 'PAUSED'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/45 mt-0.5 truncate">
                        {station!.genre} · {station!.frequency} FM · {theme.name}
                      </p>
                    </div>

                    {/* Action buttons — always visible for touch */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={(e) => handleRemoveFavorite(station!.id, e)}
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,77,77,0.15)' }}
                        aria-label="Remove from liked"
                      >
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCurrentStation) {
                            togglePlayPause();
                          } else {
                            handlePlayStation(station!.id);
                          }
                        }}
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{
                          background: isCurrentStation
                            ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
                            : 'rgba(255,255,255,0.1)',
                        }}
                        aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="w-3.5 h-3.5 text-white" fill="white" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

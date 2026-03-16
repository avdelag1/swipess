import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, Radio, Play, Pause, ChevronRight } from 'lucide-react';
import { RadioStation, CityLocation } from '@/types/radio';
import { CityTheme } from '@/types/radio';
import { getStationsByCity, cityThemes, radioStations } from '@/data/radioStations';

interface StationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: CityLocation;
  currentStation: RadioStation | null;
  isPlaying: boolean;
  favorites: string[];
  onCitySelect: (city: CityLocation) => void;
  onStationSelect: (station: RadioStation) => void;
  onToggleFavorite: (stationId: string) => void;
  isFavoritesView?: boolean;
}

const CITY_ICONS: Record<CityLocation, string> = {
  'new-york': 'NY',
  'miami': 'MI',
  'ibiza': 'IB',
  'tulum': 'TU',
  'california': 'CA',
  'texas': 'TX',
  'french': 'FR',
  'podcasts': 'PD',
  'italy': 'IT',
  'jazz': 'JZ',
  'reggae': 'RG',
  'arabic': 'AR',
  'persian': 'PR',
  'meditation': 'MD',
  'bongs': 'BG',
};

/**
 * Full-screen drawer for browsing and switching stations.
 * Shows city tabs at top, station list below.
 */
export function StationDrawer({
  isOpen,
  onClose,
  currentCity,
  currentStation,
  isPlaying,
  favorites,
  onCitySelect,
  onStationSelect,
  onToggleFavorite,
  isFavoritesView = false,
}: StationDrawerProps) {
  const stations = isFavoritesView
    ? radioStations.filter(s => favorites.includes(s.id))
    : getStationsByCity(currentCity);

  const theme = isFavoritesView ? null : cityThemes[currentCity];
  const allCities = Object.keys(cityThemes) as CityLocation[];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl overflow-hidden bg-card"
            style={{
              background: 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)',
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <div>
                <h2 className="text-foreground text-lg font-bold">{isFavoritesView ? 'Liked Stations' : 'Stations'}</h2>
                <p className="text-muted-foreground text-xs">{isFavoritesView ? 'Your favorites' : theme?.name} - {stations.length} available</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                aria-label="Close station drawer"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            </div>

            {/* City tabs - horizontal scroll */}
            {!isFavoritesView && (
              <div className="px-5 pb-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {allCities.map((city) => {
                    const ct = cityThemes[city];
                    const isActive = city === currentCity;
                    return (
                      <motion.button
                        key={city}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onCitySelect(city)}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${isActive
                            ? 'text-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        style={isActive ? {
                          background: `linear-gradient(135deg, ${ct.primaryColor}80, ${ct.secondaryColor}60)`,
                        } : undefined}
                      >
                        <span className="text-[10px] font-bold opacity-60">
                          {CITY_ICONS[city]}
                        </span>
                        {ct.name}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Station list */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-1.5" style={{ maxHeight: 'calc(85vh - 180px)' }}>
              {stations.map((station, index) => {
                const isCurrent = currentStation?.id === station.id;
                const isFav = favorites.includes(station.id);

                return (
                  <motion.div
                    key={station.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <button
                      onClick={() => {
                        onStationSelect(station);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${isCurrent
                          ? 'bg-muted border border-border'
                          : 'hover:bg-muted/50'
                        }`}
                    >
                      {/* Station icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={isFavoritesView ? { background: 'linear-gradient(135deg, #ff00ff40, #ff005530)' } : {
                          background: `linear-gradient(135deg, ${theme?.primaryColor}40, ${theme?.secondaryColor}30)`,
                        }}
                      >
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end gap-0.5 h-4">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1 bg-foreground rounded-full"
                                animate={{
                                  height: ['40%', '100%', '60%', '100%', '40%'],
                                }}
                                transition={{
                                  duration: 0.8,
                                  repeat: Infinity,
                                  delay: i * 0.15,
                                  ease: 'easeInOut',
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <Radio className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>

                      {/* Station info */}
                      <div className="flex-1 text-left min-w-0">
                        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-foreground' : 'text-foreground/80'}`}>
                          {station.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {station.frequency} · {station.genre}
                        </p>
                      </div>

                      {/* Favorite button */}
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(station.id);
                        }}
                        className="p-1.5 flex-shrink-0"
                        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <ThumbsUp
                          className={`w-4 h-4 transition-colors ${isFav ? 'text-red-400 fill-red-400' : 'text-muted-foreground/30'
                            }`}
                        />
                      </motion.button>

                      {/* Arrow */}
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Play, Music, Globe, Star } from 'lucide-react';
import { radioStations, cityThemes } from '@/data/radioStations';
import { RadioStation, CityLocation } from '@/types/radio';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

interface StationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isFavoritesView: boolean;
  currentCity: CityLocation;
  currentStation: RadioStation | null;
  isPlaying: boolean;
  favorites: string[];
  onCitySelect: (city: CityLocation) => void;
  onStationSelect: (stationId: string) => void;
  onToggleFavorite: (stationId: string) => void;
}

export const StationDrawer = ({
  isOpen,
  onClose,
  isFavoritesView,
  currentCity,
  currentStation,
  isPlaying,
  favorites,
  onCitySelect,
  onStationSelect,
  onToggleFavorite
}: StationDrawerProps) => {
  // Use current city's theme or Miami default
  const theme = cityThemes[currentCity] || cityThemes['miami'];
  const accentColor = theme.primaryColor;

  // Filter stations based on favorites view or current city
  const filteredStations = isFavoritesView
    ? radioStations.filter(s => favorites.includes(s.id))
    : radioStations.filter(s => s.city === currentCity);

  const cities = Object.values(cityThemes);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-[#0a0a0a] border-t border-white/10 rounded-t-[2.5rem] p-6 z-[101] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  {isFavoritesView ? <Star size={20} fill={accentColor} /> : <Music size={20} />}
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {isFavoritesView ? 'FAVORITES' : `WORLD STATIONS`}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* City Selection (Only in main view) */}
            {!isFavoritesView && (
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-4 mb-4">
                {cities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => onCitySelect(city.id as CityLocation)}
                    className={cn(
                      "flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all border",
                      currentCity === city.id 
                        ? "bg-white text-black border-white" 
                        : "bg-white/5 text-white/40 border-white/5 hover:border-white/20"
                    )}
                  >
                    {city.name.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {/* Station List */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-3">
              {filteredStations.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-white/20">
                  <Globe size={48} className="mb-4 opacity-30" />
                  <p className="font-bold">NO STATIONS FOUND</p>
                </div>
              ) : (
                filteredStations.map((station) => {
                  const isActive = currentStation?.id === station.id;
                  const isFavorite = favorites.includes(station.id);

                  return (
                    <div 
                      key={station.id}
                      className={cn(
                        "group relative flex items-center justify-between p-4 rounded-2xl transition-all border",
                        isActive 
                          ? "bg-white/10 border-white/20" 
                          : "bg-white/5 border-transparent hover:border-white/10"
                      )}
                    >
                      <button 
                        className="flex items-center gap-4 flex-1 text-left"
                        onClick={() => onStationSelect(station.id)}
                      >
                        <div className="relative w-12 h-12 rounded-xl bg-black flex items-center justify-center overflow-hidden border border-white/10">
                          {isActive && isPlaying && (
                            <div className="absolute inset-0 bg-white/10 animate-pulse" />
                          )}
                          <Play size={20} className={isActive ? "text-white" : "text-white/20"} fill={isActive ? "white" : "none"} />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-white/10 text-white/40">
                              {station.frequency}
                            </span>
                            <h3 className={cn(
                              "font-bold text-sm tracking-wide",
                              isActive ? "text-white" : "text-white/70"
                            )}>
                              {station.name.toUpperCase()}
                            </h3>
                          </div>
                          <p className="text-[10px] text-white/30 font-bold tracking-widest uppercase mt-0.5">
                            {station.genre} • {station.description}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          onToggleFavorite(station.id);
                        }}
                        className="w-10 h-10 flex items-center justify-center transition-transform active:scale-95"
                      >
                        <Heart 
                          size={20} 
                          className={cn(
                            isFavorite ? "text-rose-500" : "text-white/10 group-hover:text-white/30"
                          )} 
                          fill={isFavorite ? "currentColor" : "none"} 
                        />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Safe Area */}
            <div className="h-6" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

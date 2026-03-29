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
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-3 stagger-enter">
              {filteredStations.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-white/20">
                  <Globe size={40} className="mb-4 opacity-30" />
                  <p className="font-black text-xs tracking-widest">STATIONS OFFLINE</p>
                </div>
              ) : (
                filteredStations.map((station) => {
                  const isActive = currentStation?.id === station.id;
                  const isFavorite = favorites.includes(station.id);

                  return (
                    <motion.div 
                      key={station.id}
                      layout
                      className={cn(
                        "group relative flex items-center justify-between p-4 rounded-3xl transition-all duration-500",
                        isActive 
                          ? "bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]" 
                          : "bg-white/[0.03] hover:bg-white/[0.06]"
                      )}
                    >
                      {/* Active Border Glow */}
                      {isActive && (
                        <div 
                          className="absolute inset-x-0 bottom-0 h-[2px] rounded-full blur-[2px] animate-pulse"
                          style={{ backgroundColor: accentColor }}
                        />
                      )}

                      <button 
                        className="flex items-center gap-5 flex-1 text-left"
                        onClick={() => {
                          triggerHaptic('medium');
                          onStationSelect(station.id);
                        }}
                      >
                        <div className="relative w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                          {isActive && isPlaying ? (
                            <div className="flex items-center gap-[2px] h-6">
                              {[0, 1, 2].map(i => (
                                <motion.div
                                  key={i}
                                  animate={{ height: ['40%', '100%', '60%', '80%', '40%'] }}
                                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                                  className="w-[3px] rounded-full"
                                  style={{ backgroundColor: accentColor }}
                                />
                              ))}
                            </div>
                          ) : (
                            <Play size={22} className={cn("transition-colors", isActive ? "text-white" : "text-white/20")} fill={isActive ? "white" : "none"} />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-white/5 text-white/40 border border-white/5">
                              {station.frequency}
                            </span>
                            <h3 className={cn(
                              "font-black text-sm tracking-tight transition-colors",
                              isActive ? "text-white" : "text-white/60 group-hover:text-white"
                            )}>
                              {station.name.toUpperCase()}
                            </h3>
                          </div>
                          <p className="text-[10px] text-white/30 font-bold tracking-wider line-clamp-1 uppercase">
                            {station.genre} • {station.description}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          onToggleFavorite(station.id);
                        }}
                        className="ml-2 w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-all active:scale-90"
                      >
                        <Heart 
                          size={20} 
                          className={cn(
                            "transition-all duration-300",
                            isFavorite ? "text-rose-500 scale-110" : "text-white/10 group-hover:text-white/30"
                          )} 
                          fill={isFavorite ? "currentColor" : "none"}
                          style={isFavorite ? { filter: 'drop-shadow(0 0 10px rgba(244,63,94,0.4))' } : {}}
                        />
                      </button>
                    </motion.div>
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

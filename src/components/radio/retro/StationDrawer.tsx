import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Play, Music, Globe, Star, LayoutGrid, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10099]"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className={cn(
               "fixed inset-0 z-[10100] overflow-hidden flex flex-col",
               "modal-liquid-glass p-6",
            )}
            style={{ 
              '--accent-dynamic': accentColor,
              '--accent-dynamic-alpha': `${accentColor}20`
            } as React.CSSProperties}
          >
            {/* Liquid Shine Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
               <div className="liquid-glass-highlight--animated absolute inset-0" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--accent-dynamic-alpha)] text-[var(--accent-dynamic)]"
                >
                  {isFavoritesView ? <Star size={20} className="fill-[var(--accent-dynamic)]" /> : <Music size={20} />}
                </div>
                <h2 className="text-3xl font-black text-foreground tracking-tighter italic">
                  {isFavoritesView ? 'FAVORITES' : `WORLD RADIOS`}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            {!isFavoritesView && (
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-6 mb-4 relative z-10">
                {cities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => onCitySelect(city.id as CityLocation)}
                    className={cn(
                      "flex-shrink-0 px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest transition-all border",
                      currentCity === city.id 
                        ? "bg-foreground text-background border-foreground shadow-lg shadow-black/10" 
                        : "bg-foreground/5 text-foreground/40 border-foreground/5 hover:border-foreground/20"
                    )}
                  >
                    {city.name.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {/* Global Directory Link */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => { triggerHaptic('medium'); onClose(); navigate('/radio/directory'); }}
              className="w-full mb-6 p-4 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-between group hover:bg-primary/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <LayoutGrid size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Full Experience</p>
                  <h4 className="text-sm font-black text-foreground italic uppercase tracking-tight">Global Directory</h4>
                </div>
              </div>
              <ChevronRight size={20} className="text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </motion.button>

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
                        "group relative flex items-center justify-between p-5 rounded-[2rem] transition-all duration-500",
                        isActive 
                          ? "bg-foreground/10 shadow-xl shadow-black/5" 
                          : "bg-foreground/[0.03] hover:bg-foreground/[0.06]"
                      )}
                    >
                      {/* Active Border Glow */}
                      {isActive && (
                        <div className="absolute inset-x-0 bottom-0 h-[2px] rounded-full blur-[2px] animate-pulse bg-[var(--accent-dynamic)]" />
                      )}

                      <button 
                        className="flex items-center gap-5 flex-1 text-left"
                        onClick={() => {
                          triggerHaptic('medium');
                          onStationSelect(station.id);
                        }}
                      >
                        <div className="relative w-16 h-16 rounded-[1.25rem] bg-foreground/5 flex items-center justify-center overflow-hidden border border-foreground/10 shadow-inner">
                          {isActive && isPlaying ? (
                            <div className="flex items-center gap-[2px] h-6">
                              {[0, 1, 2].map(i => (
                                <motion.div
                                  key={i}
                                  animate={{ height: ['40%', '100%', '60%', '80%', '40%'] }}
                                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                                  className="w-[3px] rounded-full bg-[var(--accent-dynamic)]"
                                />
                              ))}
                            </div>
                          ) : (
                            <Play size={24} className={cn("transition-all duration-300", isActive ? "text-foreground" : "text-foreground/20")} fill={isActive ? "currentColor" : "none"} />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <span className={cn(
                               "text-[9px] font-black px-1.5 py-0.5 rounded-md border",
                               isActive ? "bg-white/10 text-white border-white/20" : "bg-foreground/5 text-foreground/60 border-foreground/10"
                             )}>
                              {station.frequency}
                            </span>
                            <h3 className={cn(
                              "font-black text-base tracking-tighter transition-colors",
                              isActive ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"
                            )}>
                              {station.name.toUpperCase()}
                            </h3>
                          </div>
                          <p className={cn(
                            "text-[11px] font-black tracking-widest line-clamp-1 uppercase",
                            isActive ? "text-foreground/60" : "text-foreground/40"
                          )}>
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
                            isFavorite ? "text-rose-500 scale-110 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]" : "text-white/10 group-hover:text-white/30"
                          )} 
                          fill={isFavorite ? "currentColor" : "none"}
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



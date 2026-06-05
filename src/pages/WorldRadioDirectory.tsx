import { useMemo, useState } from 'react';
import { QuickFilterImage } from '@/components/ui/QuickFilterImage';
import { AnimatePresence, motion } from 'framer-motion';
import { RadioSkinBackground } from '@/components/radio/RadioSkinBackground';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRadio } from '@/contexts/RadioContext';
import { cityThemes, radioStations } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { useRadioSkin } from '@/hooks/useRadioSkin';
import {
  ArrowLeft, Globe, Heart, MapPin, Maximize2,
  Play, Radio, Search, Shuffle,
  Sparkles, Volume2
} from 'lucide-react';

const CARD_SPRING = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.7 };

export default function WorldRadioDirectory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, play, toggleFavorite, isStationFavorite, shuffleAndPlay } = useRadio();
  const { skin } = useRadioSkin();
  const { isDark: appIsDark } = useAppTheme();
  
  const isDark = skin === 'cheetah' || (skin === 'theme' && appIsDark);
  const [searchQuery, setSearchQuery] = useState('');
  
  const initialFilter = searchParams.get('filter') === 'favorites' ? 'favorites' : 'all';
  const [selectedCity, setSelectedCity] = useState<CityLocation | 'all' | 'favorites'>(initialFilter as any);

  const cities = useMemo(() => Object.values(cityThemes), []);

  const filteredStations = useMemo(() => {
    return radioStations.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.genre?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                          s.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = true;
      if (selectedCity === 'all') {
        matchesFilter = true;
      } else if (selectedCity === 'favorites') {
        matchesFilter = isStationFavorite(s.id);
      } else {
        matchesFilter = s.city === selectedCity;
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, selectedCity, isStationFavorite]);


  const handleStationPlay = (station: any) => {
    triggerHaptic('medium');
    play(station);
  };

  // Glassmorphism classes unified
  const glassPanelClasses = isDark 
    ? "bg-black/35 backdrop-blur-[24px] border border-white/15 shadow-2xl" 
    : "bg-white/35 backdrop-blur-[24px] border border-black/10 shadow-2xl";

  const glassButtonClasses = isDark
    ? "bg-black/30 backdrop-blur-[24px] border border-white/15 text-white hover:bg-white/20 shadow-xl"
    : "bg-white/40 backdrop-blur-[24px] border border-black/10 text-foreground hover:bg-black/5 shadow-xl";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] h-[100dvh] overflow-y-auto overflow-x-hidden flex flex-col",
        isDark ? "text-white" : "text-foreground"
      )}
      style={{ background: isDark ? '#0a0705' : 'hsl(var(--background))' }}
    >
      <RadioSkinBackground />

      {/* 🛸 STICKY HEADER */}
      <div
        className={cn(
          "sticky top-0 z-50 pt-[calc(env(safe-area-inset-top)+12px)] pb-4 px-4 border-b",
          isDark ? "bg-black/40 backdrop-blur-[24px] border-white/15 shadow-xl" : "bg-white/40 backdrop-blur-[24px] border-black/10 shadow-xl"
        )}
      >
        <div className="flex items-center mb-4 gap-3">
          <button
            onClick={() => navigate('/radio')}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-full transition-colors active:scale-95 shrink-0",
              glassButtonClasses
            )}
            title="Back to Radio"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex flex-col flex-1">
            <h1 className="text-2xl font-black tracking-tighter italic uppercase leading-none mb-1">
              World <span className="text-primary">Radio</span>
            </h1>
            <div className="flex items-center gap-1.5 opacity-60">
              <Globe size={12} className="animate-spin-slow" />
              <span className="text-[10px] font-black tracking-widest uppercase">Global Frequency Network</span>
            </div>
          </div>
          
          <button
            onClick={() => {
              triggerHaptic('medium');
              shuffleAndPlay(filteredStations);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all active:scale-95 shrink-0",
              isDark 
                ? "bg-primary/20 backdrop-blur-[24px] border border-primary/30 text-primary hover:bg-primary/30 shadow-xl shadow-primary/20" 
                : "bg-primary backdrop-blur-[24px] border border-primary/20 text-primary-foreground shadow-xl shadow-primary/30"
            )}
          >
            <Shuffle size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-[11px] font-black uppercase tracking-widest italic">Shuffle</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group mb-4">
          <div className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors",
            isDark ? "text-white/50" : "text-muted-foreground"
          )}>
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stations, genres, cities..."
            className={cn(
              "w-full h-12 rounded-xl pl-12 pr-5 text-sm font-bold transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/40",
              isDark
                ? "bg-black/30 backdrop-blur-[24px] border border-white/15 placeholder:text-white/40 text-white"
                : "bg-white/40 backdrop-blur-[24px] border border-black/10 placeholder:text-muted-foreground text-foreground"
            )}
          />
        </div>

        {/* City Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          <button
            onClick={() => { setSelectedCity('all'); triggerHaptic('light'); }}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shrink-0 transition-all active:scale-[0.97]",
              selectedCity === 'all'
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40 border border-primary/20"
                : glassButtonClasses
            )}
          >
            All Signal
          </button>

          <button
            onClick={() => { setSelectedCity('favorites'); triggerHaptic('light'); }}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shrink-0 transition-all flex items-center gap-2 active:scale-[0.97]",
              selectedCity === 'favorites'
                ? "bg-[hsl(var(--brand-rose,346_85%_61%))] text-white border-transparent shadow-lg shadow-[hsl(var(--brand-rose,346_85%_61%))]/40"
                : glassButtonClasses
            )}
          >
            <Heart size={12} fill={selectedCity === 'favorites' ? "white" : "none"} />
            Liked
          </button>
          
          {cities.map(city => (
            <button
              key={city.id}
              onClick={() => setSelectedCity(city.id as CityLocation)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shrink-0 transition-all active:scale-[0.97]",
                selectedCity === city.id
                  ? (isDark ? "bg-white text-black shadow-lg" : "bg-black text-white shadow-lg")
                  : glassButtonClasses
              )}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-4 pb-12 relative z-10 overflow-y-auto">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <AnimatePresence>
            {state.currentStation && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="w-full"
              >
                <button
                  onClick={() => navigate('/radio')}
                  className={cn(
                    "w-full p-4 rounded-3xl flex items-center justify-between transition-colors active:scale-[0.98]",
                    glassPanelClasses,
                    isDark ? "hover:bg-black/50" : "hover:bg-white/60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/20 shrink-0 shadow-inner border border-primary/20">
                      <Sparkles size={24} className="text-primary animate-pulse" />
                    </div>
                    <div className="text-left flex flex-col justify-center">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Now Playing</p>
                      <h4 className={cn(
                        "text-lg font-black italic uppercase tracking-tight truncate max-w-[200px]",
                        isDark ? "text-white" : "text-foreground"
                      )}>
                        {state.currentStation.name}
                      </h4>
                    </div>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0",
                    isDark ? "bg-white/20 text-white border border-white/10" : "bg-primary/20 text-primary border border-primary/10"
                  )}>
                    <Maximize2 size={16} />
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 🛸 STATION LISTING */}
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {filteredStations.map((station) => {
                const isPlaying = state.currentStation?.id === station.id && state.isPlaying;
                const isFav = isStationFavorite(station.id);
                const isOffline = state.deadStationIds?.includes(station.id);
                const theme = cityThemes[station.city as CityLocation] || cityThemes['miami'];

                return (
                  <motion.div
                    key={station.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={CARD_SPRING}
                    className={cn(
                      "group relative overflow-hidden rounded-[1.5rem] p-3 transition-colors duration-300 w-full flex items-center gap-3 md:gap-4",
                      isOffline ? "opacity-40 grayscale-[0.5] scale-[0.98] pointer-events-none" : "opacity-100",
                      isPlaying
                        ? (isDark ? "bg-black/40 border border-white/25 shadow-2xl" : "bg-white/60 border border-primary/30 shadow-2xl")
                        : glassPanelClasses
                    )}
                  >
                    {isOffline && (
                      <div className="absolute top-2 right-3 z-20">
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest border border-red-500/20">
                          Offline
                        </span>
                      </div>
                    )}
                    
                    <div
                      className="absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-15 pointer-events-none"
                      style={{ backgroundColor: theme.primaryColor }}
                    />

                    {/* 1. Thumbnail (Left) */}
                    <div className="relative w-[72px] h-[72px] shrink-0">
                      <div
                        className="absolute inset-0 rounded-[1.25rem] overflow-hidden border border-white/15 shadow-xl flex items-center justify-center"
                        style={{
                          background: station.albumArt
                            ? undefined
                            : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}55)`,
                        }}
                      >
                        {station.albumArt ? (
                          <QuickFilterImage
                            src={station.albumArt}
                            alt={station.name}
                            className="opacity-90 group-hover:opacity-100 transition-opacity"
                          />
                        ) : (
                          <span className="text-white font-black text-2xl tracking-tighter italic drop-shadow-xl">
                            {station.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {isPlaying && (
                          <div className="flex items-end gap-[2px] h-6">
                            {[1, 2, 3, 4].map(i => (
                              <motion.div
                                key={i}
                                animate={{ height: ['20%', '100%', '40%', '80%', '20%'] }}
                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                className="w-1.5 rounded-full bg-white drop-shadow-lg"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2 & 3 & 4. Station Info (Center Left) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                      <h3 className="font-black text-lg sm:text-xl tracking-tighter italic uppercase truncate leading-tight drop-shadow-sm mb-1">
                        {station.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border shadow-sm",
                          isDark ? "bg-black/30 text-white/80 border-white/15" : "bg-white/50 text-foreground/80 border-black/10"
                        )}>
                          {station.frequency}
                        </span>
                        <p className={cn(
                          "text-[10px] sm:text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 truncate drop-shadow-sm",
                          isDark ? "text-white/60" : "text-muted-foreground"
                        )}>
                          <MapPin size={10} style={{ color: theme.primaryColor }} className="shrink-0" />
                          <span className="truncate">{station.city} • {station.genre}</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions (Center Vertical, Far Right) */}
                    <div className="flex items-center gap-2 shrink-0 pr-1">
                      {/* Tune In Button */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStationPlay(station)}
                        className={cn(
                          "h-10 px-4 rounded-xl flex items-center justify-center gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all shadow-xl",
                          isPlaying
                            ? "bg-primary text-primary-foreground shadow-primary/40 border border-primary/20"
                            : isDark
                              ? "bg-black/40 backdrop-blur-[24px] border border-white/20 text-white hover:bg-white/10"
                              : "bg-white/60 backdrop-blur-[24px] border border-black/15 text-foreground hover:bg-black/5"
                        )}
                      >
                        {isPlaying ? <Volume2 size={14} /> : <Play size={14} fill="currentColor" />}
                        <span className="hidden sm:inline">{isPlaying ? 'Playing' : 'Tune In'}</span>
                      </motion.button>
                      
                      {/* Favorite Button */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleFavorite(station.id)}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-xl",
                          isFav
                            ? "bg-[hsl(var(--brand-rose,346_85%_61%))] border border-white/20 text-white shadow-[hsl(var(--brand-rose,346_85%_61%))]/40"
                            : isDark 
                              ? "bg-black/40 backdrop-blur-[24px] border border-white/20 text-white/70 hover:text-white hover:bg-white/10" 
                              : "bg-white/60 backdrop-blur-[24px] border border-black/15 text-foreground/70 hover:text-foreground hover:bg-black/5"
                        )}
                        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart size={16} fill={isFav ? "currentColor" : "none"} strokeWidth={isFav ? 1 : 2.5} />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* 🛰️ EMPTY STATE */}
          {filteredStations.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "w-full flex flex-col items-center justify-center py-20 text-center rounded-[2rem]",
                glassPanelClasses
              )}
            >
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner",
                glassButtonClasses
              )}>
                <Radio className="w-10 h-10 opacity-50" />
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-widest opacity-80">No Signals Found</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mt-2">Adjust your frequency filters</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { QuickFilterImage } from '@/components/ui/QuickFilterImage';
import { motion, AnimatePresence } from 'framer-motion';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRadio } from '@/contexts/RadioContext';
import { radioStations, cityThemes } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { 
  ArrowLeft, Globe, Search, Play, Heart, 
  MapPin, Radio, Volume2, Sparkles,
  Maximize2, Shuffle
} from 'lucide-react';

export default function WorldRadioDirectory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, play, toggleFavorite, isStationFavorite, shuffleAndPlay } = useRadio();
  const { isDark } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize with 'favorites' if param exists
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

  return (
    <div className={cn(
      "h-[100dvh] overflow-y-auto overflow-x-hidden flex flex-col relative",
      isDark ? "bg-[#050505] text-white" : "bg-background text-foreground"
    )}>
      <AtmosphericLayer variant="primary" />

      {/* 🛸 STICKY HEADER — Stays on top, doesn't overlap cards */}
      <div className={cn(
        "sticky top-0 z-50 pt-[calc(env(safe-area-inset-top)+12px)] pb-4 px-6 border-b transition-colors",
        isDark ? "bg-[#050505] border-white/5" : "bg-background/80 backdrop-blur-xl border-border/40"
      )}>
        <div className="flex items-center mb-4 gap-4">
          <button
            onClick={() => navigate('/radio')}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:scale-105",
              isDark ? "bg-white/10 hover:bg-white/20" : "bg-foreground/5 hover:bg-foreground/10 border border-border/50"
            )}
            title="Back to Radio"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col flex-1">
            <h1 className="text-2xl font-black tracking-tighter italic uppercase">
              World <span className="text-primary">Radio</span>
            </h1>
            <div className="flex items-center gap-1.5 opacity-40">
              <Globe size={10} className="animate-spin-slow" />
              <span className="text-[9px] font-black tracking-widest uppercase">Global Frequency Network</span>
            </div>
          </div>
          
          <button
            onClick={() => {
              triggerHaptic('medium');
              shuffleAndPlay(filteredStations);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95 border group",
              isDark 
                ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20" 
                : "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
            )}
          >
            <Shuffle size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Shuffle</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group mb-4">
          <div className={cn(
            "absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors",
            isDark ? "text-white/30" : "text-black/30"
          )}>
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stations, genres, cities..."
            className={cn(
              "w-full h-12 border rounded-2xl pl-14 pr-6 text-sm font-bold transition-all focus:outline-none focus:border-primary/50",
              isDark
                ? "bg-white/5 border-white/10 placeholder:text-white/20 text-white"
                : "bg-card border-border placeholder:text-muted-foreground text-foreground"
            )}
          />
        </div>

        {/* City Filter scroller */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-2 px-2">
          <button
            onClick={() => { setSelectedCity('all'); triggerHaptic('light'); }}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all border",
              selectedCity === 'all'
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
                : isDark
                  ? "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                  : "bg-card border-border text-foreground/70 hover:border-foreground/20"
            )}
          >
            All Signal
          </button>
          
          <button
            onClick={() => { setSelectedCity('favorites'); triggerHaptic('light'); }}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all border flex items-center gap-2",
              selectedCity === 'favorites'
                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30"
                : isDark
                  ? "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                  : "bg-card border-border text-foreground/70 hover:border-foreground/20"
            )}
          >
            <Heart size={10} fill={selectedCity === 'favorites' ? "white" : "none"} />
            Liked
          </button>
          {cities.map(city => (
            <button
              key={city.id}
              onClick={() => setSelectedCity(city.id as CityLocation)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all border",
                selectedCity === city.id
                  ? (isDark ? "bg-white text-black border-white" : "bg-foreground text-background border-foreground") + " shadow-lg"
                  : isDark
                    ? "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                    : "bg-card border-border text-foreground/70 hover:border-foreground/20"
              )}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-6 pb-10 relative z-10 overflow-y-auto">
        {/* 🛸 STATION GRID — Simplified and always visible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredStations.map((station) => {
              const isPlaying = state.currentStation?.id === station.id && state.isPlaying;
              const isFav = isStationFavorite(station.id);
              const isOffline = state.deadStationIds?.includes(station.id);
              const theme = cityThemes[station.city as CityLocation] || cityThemes['miami'];

              return (
                <motion.div
                  key={station.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "group relative overflow-hidden rounded-[2.5rem] p-5 border transition-all duration-500",
                    isOffline ? "opacity-40 grayscale-[0.5] scale-[0.98] pointer-events-none" : "opacity-100",
                    isPlaying 
                      ? (isDark ? "bg-white/10 border-white/20" : "bg-primary/5 border-primary/30")
                      : (isDark ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]" : "bg-card border-border hover:border-foreground/15 shadow-sm")
                  )}
                >
                  {isOffline && (
                    <div className="absolute top-4 right-6 z-20">
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest border border-red-500/20">
                        Offline
                      </span>
                    </div>
                  )}
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10"
                    style={{ backgroundColor: theme.primaryColor }}
                  />

                  <div className="relative z-10 flex items-center gap-5">
                    <div className="relative w-20 h-20 shrink-0">
                      <div
                        className="absolute inset-0 rounded-3xl overflow-hidden border border-white/10 shadow-lg flex items-center justify-center"
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
                          <span className="text-white font-black text-2xl tracking-tighter italic drop-shadow-lg">
                            {station.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isPlaying && (
                          <div className="flex items-end gap-1 h-6">
                            {[1, 2, 3, 4].map(i => (
                              <motion.div
                                key={i}
                                animate={{ height: ['20%', '100%', '40%', '80%', '20%'] }}
                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                className="w-1 rounded-full bg-white drop-shadow-lg"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleStationPlay(station)}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-3xl"
                      >
                        <Play size={32} fill="white" className="text-white" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-md text-[9px] font-black border transition-colors",
                          isDark ? "bg-white/10 text-white/60 border-white/10" : "bg-foreground/5 text-foreground/70 border-border"
                        )}>
                          {station.frequency}
                        </span>
                        <h3 className="font-black text-lg tracking-tighter italic uppercase truncate">
                          {station.name}
                        </h3>
                      </div>
                      
                      <p className={cn(
                        "text-[10px] font-bold tracking-widest uppercase mb-3 flex items-center gap-2",
                        isDark ? "text-white/40" : "text-muted-foreground"
                      )}>
                        <MapPin size={10} style={{ color: theme.primaryColor }} />
                        {station.city} • {station.genre}
                      </p>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleStationPlay(station)}
                          className={cn(
                            "flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.97] shadow-md",
                            isPlaying
                              ? "bg-primary text-primary-foreground shadow-primary/40"
                              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30"
                          )}
                        >
                          {isPlaying ? <Volume2 size={14} /> : <Play size={14} fill="currentColor" />}
                          {isPlaying ? 'Playing' : 'Tune In'}
                        </button>
                        <button
                          onClick={() => toggleFavorite(station.id)}
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all active:scale-95",
                            isFav
                              ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30"
                              : (isDark ? "bg-white/10 border-white/15 text-white hover:bg-white/20" : "bg-foreground/10 border-foreground/15 text-foreground hover:bg-foreground/15")
                          )}
                          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart size={16} fill={isFav ? "currentColor" : "none"} strokeWidth={2.4} />
                        </button>
                      </div>
                    </div>
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
            className="flex-1 flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
              <Radio className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-widest opacity-40">No Signals Found</h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-25 mt-2">Adjust your frequency filters</p>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {state.currentStation && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom,20px)+90px)] left-6 right-6 z-40"
          >
            <button
              onClick={() => navigate('/radio')}
              className={cn(
                "w-full p-4 rounded-[2rem] backdrop-blur-3xl border shadow-2xl flex items-center justify-between transition-colors",
                isDark
                  ? "bg-black/80 border-white/10"
                  : "bg-foreground text-background border-foreground/20 shadow-foreground/20"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  "bg-primary/25"
                )}>
                  <Sparkles size={20} className="text-primary animate-pulse" />
                </div>
                <div className="text-left">
                  <p className="text-[8px] font-black text-primary uppercase tracking-widest">Now Playing</p>
                  <h4 className={cn(
                    "text-sm font-black italic uppercase tracking-tight",
                    isDark ? "text-white" : "text-background"
                  )}>
                    {state.currentStation.name}
                  </h4>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     navigate('/radio');
                   }}
                   className={cn(
                     "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                     isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-background/15 hover:bg-background/25 text-background"
                   )}
                   title="Open full player"
                 >
                    <Maximize2 size={14} />
                 </button>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

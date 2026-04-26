import { useState, useMemo } from 'react';
import { QuickFilterImage } from '@/components/ui/QuickFilterImage';
import { motion, AnimatePresence } from 'framer-motion';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { useNavigate } from 'react-router-dom';
import { useRadio } from '@/contexts/RadioContext';
import { radioStations, cityThemes } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { 
  ArrowLeft, Globe, Search, Play, Heart, 
  MapPin, Radio, Volume2, Sparkles,
  Maximize2
} from 'lucide-react';

export default function WorldRadioDirectory() {
  const navigate = useNavigate();
  const { state, play, toggleFavorite, isStationFavorite } = useRadio();
  const { isDark } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityLocation | 'all'>('all');

  const cities = useMemo(() => Object.values(cityThemes), []);

  const filteredStations = useMemo(() => {
    return radioStations.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.genre?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                          s.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'all' || s.city === selectedCity;
      return matchesSearch && matchesCity;
    });
  }, [searchQuery, selectedCity]);

  const handleStationPlay = (station: any) => {
    triggerHaptic('medium');
    play(station);
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      isDark ? "bg-[#050505] text-white" : "bg-white text-slate-900"
    )}>
      <AtmosphericLayer />
      {/* ── HEADER ── */}
      <header className={cn(
        "sticky top-0 z-30 pt-[env(safe-area-inset-top,20px)] px-6 pb-6 backdrop-blur-2xl border-b",
        isDark ? "bg-black/80 border-white/5" : "bg-white/90 border-black/5"
      )}>
        <div className="flex items-center justify-between mb-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center border transition-all active:scale-90",
              isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-black tracking-tighter italic uppercase">
              World Radio <span className="text-primary">Stations</span>
            </h1>
            <div className="flex items-center gap-1.5 opacity-40">
              <Globe size={10} className="animate-spin-slow" />
              <span className="text-[9px] font-black tracking-widest uppercase">Global Frequency Network</span>
            </div>
          </div>

          <div className="w-10" />
        </div>

        {/* Search Bar */}
        <div className="relative group">
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
              "w-full h-14 border rounded-2xl pl-14 pr-6 text-sm font-bold transition-all focus:outline-none focus:border-primary/50",
              isDark 
                ? "bg-white/5 border-white/10 placeholder:text-white/20 text-white" 
                : "bg-black/5 border-black/10 placeholder:text-black/20 text-black"
            )}
          />
        </div>

        {/* City Filter scroller */}
        <div className="flex gap-2.5 overflow-x-auto pt-4 no-scrollbar -mx-2 px-2">
          <button
            onClick={() => setSelectedCity('all')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all border",
              selectedCity === 'all'
                ? "bg-primary text-black border-primary shadow-lg shadow-primary/20"
                : isDark 
                  ? "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                  : "bg-black/5 border-black/5 text-black/40 hover:border-black/10"
            )}
          >
            All Cities
          </button>
          {cities.map(city => (
            <button
              key={city.id}
              onClick={() => setSelectedCity(city.id as CityLocation)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all border",
                selectedCity === city.id
                  ? (isDark ? "bg-white text-black border-white" : "bg-black text-white border-black") + " shadow-lg"
                  : isDark 
                    ? "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                    : "bg-black/5 border-black/5 text-black/40 hover:border-black/10"
              )}
            >
              {city.name}
            </button>
          ))}
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 p-6 pb-32">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredStations.map((station) => {
              const isPlaying = state.currentStation?.id === station.id && state.isPlaying;
              const isFav = isStationFavorite(station.id);
              const theme = cityThemes[station.city as CityLocation] || cityThemes['miami'];

              return (
                <motion.div
                  key={station.id}
                  variants={itemAnim}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "group relative overflow-hidden rounded-[2.5rem] p-5 border transition-all duration-500",
                    isPlaying 
                      ? (isDark ? "bg-white/10 border-white/20" : "bg-black/10 border-black/20")
                      : (isDark ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]" : "bg-black/[0.03] border-black/5 hover:bg-black/[0.06]")
                  )}
                >
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10"
                    style={{ backgroundColor: theme.primaryColor }}
                  />

                  <div className="relative z-10 flex items-center gap-5">
                    <div className="relative w-20 h-20 shrink-0">
                      <div className="absolute inset-0 bg-black/20 rounded-3xl backdrop-blur-xl border border-white/10 overflow-hidden">
                        {station.albumArt ? (
                          <QuickFilterImage 
                            src={station.albumArt} 
                            alt={station.name}
                            className="opacity-60 group-hover:opacity-80 transition-opacity"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10" />
                        )}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isPlaying ? (
                          <div className="flex items-end gap-1 h-6">
                            {[1, 2, 3, 4].map(i => (
                              <motion.div
                                key={i}
                                animate={{ height: ['20%', '100%', '40%', '80%', '20%'] }}
                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                className="w-1 rounded-full"
                                style={{ backgroundColor: theme.primaryColor }}
                              />
                            ))}
                          </div>
                        ) : (
                          !station.albumArt && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Radio size={32} className="text-white/20 animate-pulse" />
                            </div>
                          )
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
                          isDark ? "bg-white/10 text-white/60 border-white/10" : "bg-black/5 text-black/60 border-black/10"
                        )}>
                          {station.frequency}
                        </span>
                        <h3 className="font-black text-lg tracking-tighter italic uppercase truncate">
                          {station.name}
                        </h3>
                      </div>
                      
                      <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-3 flex items-center gap-2">
                        <MapPin size={10} style={{ color: theme.primaryColor }} />
                        {station.city} • {station.genre}
                      </p>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleStationPlay(station)}
                          className={cn(
                            "flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                            isPlaying ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                          {isPlaying ? <Volume2 size={14} /> : <Play size={14} fill="currentColor" />}
                          {isPlaying ? 'Playing' : 'Tune In'}
                        </button>
                        
                        <button
                          onClick={() => { triggerHaptic('light'); toggleFavorite(station.id); }}
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                            isFav ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-white/5 border-white/5 text-white/20 hover:border-white/10"
                          )}
                        >
                          <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filteredStations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
            <Radio size={48} strokeWidth={1} />
            <p className="font-black text-xs tracking-[0.3em] uppercase">No Signals Found</p>
          </div>
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
              className="w-full p-4 rounded-[2rem] bg-black/80 backdrop-blur-3xl border border-white/10 shadow-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Sparkles size={20} className="text-primary animate-pulse" />
                </div>
                <div className="text-left">
                  <p className="text-[8px] font-black text-primary uppercase tracking-widest">Now Playing</p>
                  <h4 className="text-sm font-black text-white italic uppercase tracking-tight">
                    {state.currentStation.name}
                  </h4>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Maximize2 size={14} className="text-white/40" />
                 </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

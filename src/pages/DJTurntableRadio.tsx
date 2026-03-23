import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRadio } from '@/contexts/RadioContext';
import { cityThemes } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { StationDrawer } from '@/components/radio/retro/StationDrawer';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, ListMusic, Heart, Shuffle,
  SkipBack, SkipForward, Play, Pause
} from 'lucide-react';

/**
 * DJTurntableRadio — Professional DJ turntable radio skin.
 * Purely CSS-driven visuals for high performance.
 */
export default function DJTurntableRadio() {
  const navigate = useNavigate();
  const {
    state, error, play, togglePlayPause, changeStation,
    setCity, setVolume, toggleShuffle, toggleFavorite, isStationFavorite,
  } = useRadio();

  const [showDrawer, setShowDrawer] = useState(false);
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState(false);

  const cityTheme = cityThemes[state.currentCity] || cityThemes['tulum'];
  const primaryColor = cityTheme.primaryColor;
  const secondaryColor = cityTheme.secondaryColor;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlayPause(); break;
        case 'ArrowRight': changeStation('next'); break;
        case 'ArrowLeft': changeStation('prev'); break;
        case 'ArrowUp': setVolume(Math.min(1, state.volume + 0.05)); break;
        case 'ArrowDown': setVolume(Math.max(0, state.volume - 0.05)); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.volume, togglePlayPause, changeStation, setVolume]);

  const handleCitySelect = useCallback((city: CityLocation) => {
    setCity(city);
    triggerHaptic('light');
  }, [setCity]);

  const handleStationSelect = useCallback((station: any) => {
    play(station);
    triggerHaptic('medium');
    setShowDrawer(false);
    setShowFavoritesDrawer(false);
  }, [play]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col overflow-hidden select-none",
        "bg-[radial-gradient(ellipse_at_50%_30%,#1a1a1a_0%,#0a0a0a_60%,#050505_100%)]"
      )}
    >
      {/* Floating top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-2 uppercase tracking-[0.2em]">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </motion.button>

        <span
          className="text-sm font-bold font-['Bebas_Neue']"
          style={{ color: primaryColor }}
        >
          {cityTheme.name}
        </span>

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { toggleShuffle(); triggerHaptic('light'); }}
            className={cn("w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors", state.isShuffle ? "bg-white/15" : "bg-white/5")}
          >
            <Shuffle className="w-4 h-4 text-white/70" />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { triggerHaptic('light'); navigate('/radio/cassette'); }}
            className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center"
            title="Switch to Cassette skin"
          >
            <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <circle cx="7" cy="12" r="2"/>
              <circle cx="17" cy="12" r="2"/>
              <path d="M9 12h6"/>
            </svg>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowDrawer(true)}
            className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center"
          >
            <ListMusic className="w-4 h-4 text-white/70" />
          </motion.button>
        </div>
      </div>

      {/* Main turntable area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-4">
        {/* Turntable deck surface */}
        <div
          className="relative w-full max-w-[340px] aspect-square rounded-2xl bg-gradient-to-br from-[#1c1c1c] via-[#111] to-[#0d0d0d] shadow-2xl border-t border-white/5"
          style={{
            boxShadow: `0 0 60px -20px ${primaryColor}22, inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 60px -10px rgba(0,0,0,0.8)`,
          }}
        >
          {/* Metallic platter ring */}
          <div className="absolute inset-3 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] bg-[radial-gradient(circle,transparent_48%,#2a2a2a_49%,#3a3a3a_50%,#2a2a2a_51%,transparent_52%),radial-gradient(circle,transparent_95%,#333_96%,#222_100%)]" />

          {/* Spinning vinyl record */}
          <motion.div
            className="absolute inset-5 rounded-full shadow-inner"
            style={{
              background: `
                radial-gradient(circle, ${primaryColor}dd 0%, ${primaryColor}aa 12%, transparent 13%),
                radial-gradient(circle, transparent 13%, #111 14%, #0a0a0a 15%, transparent 16%),
                radial-gradient(circle, transparent 18%, rgba(255,255,255,0.03) 19%, transparent 20%),
                radial-gradient(circle, transparent 24%, rgba(255,255,255,0.02) 25%, transparent 26%),
                radial-gradient(circle, transparent 30%, rgba(255,255,255,0.03) 31%, transparent 32%),
                radial-gradient(circle, transparent 36%, rgba(255,255,255,0.02) 37%, transparent 38%),
                radial-gradient(circle, transparent 42%, rgba(255,255,255,0.03) 43%, transparent 44%),
                radial-gradient(circle, transparent 48%, rgba(255,255,255,0.02) 49%, transparent 50%),
                radial-gradient(circle, transparent 55%, rgba(255,255,255,0.03) 56%, transparent 57%),
                radial-gradient(circle, transparent 62%, rgba(255,255,255,0.02) 63%, transparent 64%),
                radial-gradient(circle, transparent 69%, rgba(255,255,255,0.03) 70%, transparent 71%),
                radial-gradient(circle, transparent 76%, rgba(255,255,255,0.02) 77%, transparent 78%),
                radial-gradient(circle, transparent 83%, rgba(255,255,255,0.03) 84%, transparent 85%),
                radial-gradient(circle, transparent 90%, rgba(255,255,255,0.02) 91%, transparent 92%),
                #0a0a0a
              `,
              boxShadow: `inset 0 0 30px rgba(0,0,0,0.6), 0 0 15px ${primaryColor}11`,
            }}
            animate={{ rotate: state.isPlaying ? 360 : 0 }}
            transition={state.isPlaying ? { duration: 1.8, ease: 'linear', repeat: Infinity } : { duration: 0.5, ease: 'easeOut' }}
          >
            {/* Center label */}
            <div
              className="absolute inset-0 m-auto w-[32%] h-[32%] rounded-full flex flex-col items-center justify-center p-1"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}ee, ${secondaryColor}ee)`,
                boxShadow: `0 0 20px ${primaryColor}33`,
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-black/60 mb-1 border border-white/10" />
              <p className="text-[7px] font-bold text-white/90 text-center leading-tight truncate max-w-full font-['Bebas_Neue'] tracking-wider">
                {state.currentStation?.name || 'NO SIGNAL'}
              </p>
              <p className="text-[5px] text-white/50 tracking-wider uppercase">
                {state.currentStation?.frequency || '---'}
              </p>
            </div>

            {/* Light reflection */}
            <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-br from-white/10 via-transparent to-white/5" />
          </motion.div>

          {/* Tonearm */}
          <motion.div
            className="absolute -right-2 -top-2 w-32 h-32 origin-[85%_15%] z-10"
            animate={{ rotate: state.isPlaying ? 22 : 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          >
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <circle cx="100" cy="18" r="8" fill="#333" stroke="#444" strokeWidth="1" />
              <circle cx="100" cy="18" r="4" fill="#555" />
              <line x1="100" y1="18" x2="30" y2="90" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-md" />
              <rect x="22" y="85" width="18" height="6" rx="1" fill="#888" transform="rotate(-42, 30, 90)" className="drop-shadow-sm" />
              <rect x="18" y="92" width="8" height="4" rx="0.5" fill={primaryColor} transform="rotate(-42, 30, 90)" />
              <line x1="20" y1="96" x2="17" y2="99" stroke="#ddd" strokeWidth="0.8" transform="rotate(-42, 30, 90)" />
            </svg>
          </motion.div>

          {/* Playing glow */}
          <AnimatePresence>
            {state.isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ boxShadow: `0 0 80px -20px ${primaryColor}44, inset 0 0 40px -15px ${primaryColor}11` }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Station info */}
        <div className="mt-5 text-center w-full max-w-[340px]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={state.currentStation?.id || 'none'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-white text-2xl font-bold font-['Bebas_Neue'] tracking-wider">
                {state.currentStation?.name || 'No Station'}
              </h2>
              <p className="text-white/40 text-xs mt-0.5">
                {state.currentStation?.genre || ''}
                {state.currentStation?.genre && state.currentStation?.frequency && ' · '}
                {state.currentStation?.frequency || ''}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center gap-5 w-full max-w-[340px] justify-center">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => { if (state.currentStation) { toggleFavorite(state.currentStation.id); triggerHaptic('light'); } }}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-colors hover:bg-white/10"
          >
            <Heart className="w-4 h-4" fill={state.currentStation && isStationFavorite(state.currentStation.id) ? primaryColor : 'none'} stroke={state.currentStation && isStationFavorite(state.currentStation.id) ? primaryColor : 'rgba(255,255,255,0.4)'} />
          </motion.button>

          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => { changeStation('prev'); triggerHaptic('medium'); }}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#222] to-[#1a1a1a] shadow-lg border-t border-white/5"
            >
              <SkipBack className="w-5 h-5 text-white/70" fill="currentColor" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => { togglePlayPause(); triggerHaptic('medium'); }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-2xl transition-all"
              style={{ background: `linear-gradient(145deg, ${primaryColor}dd, ${primaryColor}88)`, boxShadow: `0 8px 24px ${primaryColor}44, inset 0 1px 0 rgba(255,255,255,0.15)` }}
            >
              {state.isPlaying ? <Pause className="w-7 h-7 text-white" fill="white" /> : <Play className="w-7 h-7 text-white ml-0.5" fill="white" />}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => { changeStation('next'); triggerHaptic('medium'); }}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#222] to-[#1a1a1a] shadow-lg border-t border-white/5"
            >
              <SkipForward className="w-5 h-5 text-white/70" fill="currentColor" />
            </motion.button>
          </div>

          {/* Pitch Fader */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] text-white/30 tracking-[0.15em] uppercase font-bold font-['Space_Mono']">PITCH</span>
            <div className="relative w-8 h-28 rounded-lg flex items-center justify-center bg-gradient-to-b from-[#1a1a1a] to-[#111] shadow-inner border border-white/5">
              <div className="absolute w-[2px] h-[85%] rounded-full bg-white/10" />
              <div className="absolute w-4 h-[1px] bg-white/15 left-1/2 top-1/2 -translate-x-1/2" />
              <motion.div
                className="absolute w-6 h-5 rounded-sm bg-gradient-to-b from-[#444] to-[#2a2a2a] shadow-md border-t border-white/10"
                style={{ top: `${(1 - state.volume) * 75 + 8}%`, left: '50%', transform: 'translateX(-50%)' }}
                drag="y"
                dragConstraints={{ top: -40, bottom: 40 }}
                dragElastic={0}
                dragMomentum={false}
                onDrag={(_, info) => {
                  const parentHeight = 112;
                  const delta = -info.delta.y / parentHeight;
                  setVolume(Math.max(0, Math.min(1, state.volume + delta)));
                }}
              >
                <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 space-y-[2px]">
                  <div className="h-[1px] bg-white/15" /><div className="h-[1px] bg-white/10" /><div className="h-[1px] bg-white/15" />
                </div>
              </motion.div>
              <span className="absolute -bottom-4 text-[7px] text-white/25 font-['Space_Mono']">{Math.round(state.volume * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="fixed top-14 left-4 right-4 z-[60] text-center">
            <span className="inline-block px-4 py-2 rounded-full text-xs font-medium text-red-300 bg-black/85 border border-red-500/30 backdrop-blur-md shadow-lg">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <StationDrawer
        isOpen={showDrawer || showFavoritesDrawer}
        onClose={() => { setShowDrawer(false); setShowFavoritesDrawer(false); }}
        isFavoritesView={showFavoritesDrawer}
        currentCity={state.currentCity}
        currentStation={state.currentStation}
        isPlaying={state.isPlaying}
        favorites={state.favorites}
        onCitySelect={handleCitySelect}
        onStationSelect={handleStationSelect}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}

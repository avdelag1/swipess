import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRadio } from '@/contexts/RadioContext';
import { cityThemes, getStationById } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { StationDrawer } from '@/components/radio/retro/StationDrawer';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import {
  ArrowLeft, ListMusic, Heart, Shuffle,
  SkipBack, SkipForward, Play, Pause, Activity
} from 'lucide-react';

// ── Stars Canvas ───────────────────────────────────────────────────────────
function RadioStarsCanvas({ accentColor: _accentColor }: { accentColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const w = window.innerWidth;
    const h = window.innerHeight;

    interface Star { x: number; y: number; size: number; opacity: number; speed: number; phase: number; glow: boolean; }
    const count = Math.min(Math.floor((w * h) / 700), 700);
    const stars: Star[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 0.75 + 0.15,
      opacity: Math.random() * 0.55 + 0.35,
      speed: Math.random() * 0.01 + 0.001,
      phase: Math.random() * Math.PI * 2,
      glow: Math.random() > 0.85,
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.12;
      for (const s of stars) {
        const twinkle = Math.sin(t * s.speed + s.phase) * 0.5 + 0.5;
        const alpha = Math.min(s.opacity * (twinkle * 0.65 + 0.35), 1);
        if (alpha < 0.02) continue;
        if (s.glow) { ctx.shadowBlur = 4; ctx.shadowColor = 'rgba(255,255,255,0.85)'; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
        if (s.glow) { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.65 }}
    />
  );
}

// ── Real-time Frequency Visualizer ──────────────────────────────────────────
function RadioVisualizer({ isPlaying, color }: { isPlaying: boolean; color: string }) {
  const { getFrequencyData } = useRadio();
  const [bars, setBars] = useState<number[]>(new Array(32).fill(0));
  const requestRef = useRef<number>(0);

  const animate = useCallback(() => {
    if (isPlaying) {
      const data = getFrequencyData();
      if (data && data.length > 0) {
        const newBars = [];
        const step = Math.floor(data.length / 32);
        for (let i = 0; i < 32; i++) {
          newBars.push(data[i * step] / 255);
        }
        setBars(newBars);
      } else {
        setBars(prev => prev.map(v => Math.max(0.1, v * 0.92 + (Math.random() * 0.08))));
      }
    } else {
      setBars(prev => prev.map(v => v * 0.8));
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [isPlaying, getFrequencyData]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  return (
    <div className="flex items-end justify-center gap-[3px] h-12 w-full mt-4 px-12">
      {bars.map((v, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full"
          style={{ 
            background: `linear-gradient(to top, ${color}22, ${color})`, 
            boxShadow: v > 0.6 ? `0 0 12px ${color}88` : 'none',
            opacity: 0.4 + (v * 0.6)
          }}
          animate={{ height: `${Math.max(6, v * 100)}%` }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      ))}
    </div>
  );
}

/**
 * DJTurntableRadio — Professional DJ turntable radio skin (Flagship Overhaul).
 * Unified "God Mode" experience with liquid-glass aesthetics and vertical pitch control.
 */
export default function DJTurntableRadio() {
  const navigate = useNavigate();
  const {
    state, error: _error, play, togglePlayPause, togglePower, changeStation,
    setCity, setVolume, toggleShuffle, toggleFavorite, isStationFavorite,
  } = useRadio();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'cheers';

  const [showDrawer, setShowDrawer] = useState(false);
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState(false);

  // Auto-power-on when visiting /radio directly
  useEffect(() => {
    if (!state.isPoweredOn) {
      togglePower();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleStationSelect = useCallback((stationId: string) => {
    const station = getStationById(stationId);
    if (station) play(station);
    triggerHaptic('medium');
    setShowDrawer(false);
    setShowFavoritesDrawer(false);
  }, [play]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col overflow-hidden select-none transition-all duration-1000",
        isDark ? "bg-[#030303]" : "bg-[#f8f9fa]"
      )}
    >
      {/* Background gradients for liquid feel */}
      <div className="absolute inset-0 opacity-50 pointer-events-none" style={{
        background: `radial-gradient(circle at 50% -10%, ${primaryColor}33 0%, transparent 60%), 
                     radial-gradient(circle at 10% 90%, ${secondaryColor}11 0%, transparent 40%)`
      }} />

      {/* Stars background */}
      <RadioStarsCanvas accentColor={primaryColor} />

      {/* Floating top bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 pt-[env(safe-area-inset-top,16px)] pb-4"
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xl transition-all",
            isDark ? "bg-white/5 backdrop-blur-2xl border-white/10" : "bg-black/5 backdrop-blur-md border-black/5"
          )}
        >
          <ArrowLeft className={cn("w-5 h-5", isDark ? "text-white/70" : "text-black/60")} />
        </motion.button>

        <div className="flex flex-col items-center">
          <motion.div 
            key={cityTheme.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("text-2xl font-black font-brand tracking-[0.2em]", isDark ? "text-white" : "text-black")}
            style={{ textShadow: isDark ? `0 0 30px ${primaryColor}88` : `0 0 20px ${primaryColor}33` }}
          >
            {cityTheme.name.toUpperCase()}
          </motion.div>
          <div className="flex items-center gap-2 mt-[-2px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#4ade80]" />
            <span className={cn("text-[10px] tracking-[0.3em] font-black uppercase", isDark ? "text-white/50" : "text-black/40")}>Streaming Live</span>
          </div>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { toggleShuffle(); triggerHaptic('light'); }}
            className={cn(
              "w-12 h-12 rounded-2xl backdrop-blur-2xl flex items-center justify-center transition-all border", 
              state.isShuffle 
                ? (isDark ? "bg-white/20 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "bg-black/10 border-black/10 shadow-lg") 
                : (isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/5 shadow-sm")
            )}
          >
            <Shuffle className={cn("w-5 h-5", state.isShuffle ? (isDark ? "text-white" : "text-black") : (isDark ? "text-white/40" : "text-black/30"))} />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowDrawer(true)}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xl transition-all",
              isDark ? "bg-white/5 backdrop-blur-2xl border-white/10" : "bg-black/5 backdrop-blur-md border-black/5"
            )}
          >
            <ListMusic className={cn("w-5 h-5", isDark ? "text-white/70" : "text-black/60")} />
          </motion.button>
        </div>
      </motion.div>

      {/* Main turntable area */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-16 overflow-hidden">
        <div className="relative w-full max-w-[440px] flex items-center justify-center">


          {/* Turntable Platter Wrapper — height-capped so it never pushes controls off screen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="relative aspect-square flex items-center justify-center"
            style={{ width: 'min(85vw, 38dvh)' }}
          >
            <AnimatePresence>
              {state.isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.5, scale: 1.2 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 rounded-full blur-[120px] pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${primaryColor}55 0%, transparent 70%)` }}
                />
              )}
            </AnimatePresence>

            <div className={cn(
              "relative w-full h-full rounded-full shadow-[0_60px_120px_rgba(0,0,0,0.8),inset_0_2px_15px_rgba(255,255,255,0.1)] border-[6px] p-3 overflow-hidden",
              isDark ? "bg-[#080808] border-[#1a1a1a]" : "bg-[#f0f0f0] border-white shadow-xl"
            )}>
              <div className={cn("absolute inset-0 opacity-20 pointer-events-none", isDark ? "bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" : "bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]")} />
              
              {/* Record Platter */}
              <motion.div
                className="absolute inset-[3%] rounded-full shadow-[inset_0_0_80px_rgba(0,0,0,1),0_20px_50px_rgba(0,0,0,1)] flex items-center justify-center"
                style={{
                  background: `
                    radial-gradient(circle at center, #050505 0%, #000 100%),
                    repeating-radial-gradient(circle at center, transparent 0, transparent 0.8px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.03) 1.5px)
                  `,
                }}
                animate={{ rotate: state.isPlaying ? 360 : 0 }}
                transition={state.isPlaying ? { duration: 2.5, ease: 'linear', repeat: Infinity } : { duration: 1.5, ease: 'circOut' }}
              >
                {/* Surface Reflection */}
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.05)_30deg,transparent_60deg,transparent_180deg,rgba(255,255,255,0.04)_210deg,transparent_240deg)] pointer-events-none" />
                
                {/* Center Label */}
                <div
                  className="relative w-[36%] h-[36%] rounded-full flex flex-col items-center justify-center p-4 z-10 overflow-hidden shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    border: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: `0 0 50px ${primaryColor}66, inset 0 2px 15px rgba(255,255,255,0.6)`
                  }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#050505] border border-white/20 z-20 flex items-center justify-center shadow-inner">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_8px_white]" />
                  </div>

                  <div className="text-center z-10 pt-6 px-2">
                    <p className="text-[14px] font-black text-white leading-tight tracking-[0.3em] uppercase mb-[4px] drop-shadow-xl line-clamp-1 font-mono">
                      {state.currentStation?.name || 'SENTIENT'}
                    </p>
                    <p className="text-[10px] text-white tracking-[0.4em] font-black uppercase font-mono bg-black/40 px-2 py-0.5 rounded-sm inline-block">
                      {state.currentStation?.frequency || 'LIVE'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Info & Visualizer Section */}
        <div className="mt-3 text-center w-full max-w-[420px] stagger-enter">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStation?.id || 'none'}
              initial={{ opacity: 0, scale: 1.15, y: 15, filter: 'blur(20px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.85, y: -15, filter: 'blur(20px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className={cn("text-4xl sm:text-5xl font-black tracking-tighter drop-shadow-2xl uppercase font-brand", isDark ? "text-white" : "!text-black")}>
                {state.currentStation?.name || 'Radio'}
              </h2>
              <div className="flex items-center justify-center gap-4 mt-1.5">
                <motion.div 
                  animate={{ scale: state.isPlaying ? [1, 1.25, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: primaryColor, boxShadow: `0 0 15px ${primaryColor}` }} 
                />
                <p className={cn("text-xs tracking-[0.6em] font-black uppercase text-center", isDark ? "text-white/60" : "!text-black/60")}>
                  {state.currentStation?.genre || 'Broadcast'}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <RadioVisualizer isPlaying={state.isPlaying} color={primaryColor} />
        </div>

        {/* Playback Controls Container */}
        <div className="mt-auto mb-6 flex flex-col items-center gap-5 w-full max-w-[440px] stagger-enter">
          <div className="flex items-center gap-6">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => { if (state.currentStation) { toggleFavorite(state.currentStation.id); triggerHaptic('light'); } }}
              className={cn(
                "w-16 h-16 rounded-3xl flex items-center justify-center border shadow-2xl transition-all",
                isDark ? "bg-white/5 backdrop-blur-3xl border-white/10" : "bg-black/5 backdrop-blur-md border-black/5"
              )}
            >
              <Heart 
                className="w-7 h-7 transition-all duration-500" 
                fill={state.currentStation && isStationFavorite(state.currentStation.id) ? primaryColor : 'none'} 
                stroke={state.currentStation && isStationFavorite(state.currentStation.id) ? primaryColor : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)')} 
                style={state.currentStation && isStationFavorite(state.currentStation.id) ? { filter: `drop-shadow(0 0 20px ${primaryColor})` } : {}}
              />
            </motion.button>

            <div className={cn(
              "flex items-center gap-4 rounded-[50px] p-2.5 border shadow-[0_30px_60px_rgba(0,0,0,0.3)] transition-all",
              isDark ? "bg-white/5 backdrop-blur-3xl border-white/10" : "bg-black/5 backdrop-blur-md border-black/5"
            )}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { changeStation('prev'); triggerHaptic('medium'); }}
                className={cn("w-16 h-16 rounded-full flex items-center justify-center transition-colors", isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10")}
              >
                <SkipBack className={cn("w-7 h-7", isDark ? "text-white/50" : "text-black/40")} fill="currentColor" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { togglePlayPause(); triggerHaptic('heavy'); }}
                className="w-28 h-28 rounded-full flex items-center justify-center relative shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-2 border-white/20"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: `0 0 60px ${primaryColor}33, inset 0 2px 20px rgba(255,255,255,0.5)`
                }}
              >
                {state.isPlaying ? <Pause className="w-12 h-12 text-white" fill="white" /> : <Play className="w-12 h-12 text-white ml-2" fill="white" />}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { changeStation('next'); triggerHaptic('medium'); }}
                className={cn("w-16 h-16 rounded-full flex items-center justify-center transition-colors", isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10")}
              >
                <SkipForward className={cn("w-7 h-7", isDark ? "text-white/50" : "text-black/40")} fill="currentColor" />
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => { navigate('/radio/playlists'); triggerHaptic('light'); }}
              className={cn(
                "w-16 h-16 rounded-3xl flex items-center justify-center border shadow-2xl transition-all",
                isDark ? "bg-white/5 backdrop-blur-3xl border-white/10" : "bg-black/5 backdrop-blur-md border-black/5"
              )}
            >
              <div className={cn("w-7 h-7 border-[3px] rounded-full flex items-center justify-center relative", isDark ? "border-white/40" : "border-black/30")}>
                <div className={cn("w-2.5 h-2.5 rounded-full", isDark ? "bg-white/40" : "bg-black/30")} />
                <div className={cn("absolute inset-[-6px] border rounded-full", isDark ? "border-white/10" : "border-black/5")} />
              </div>
            </motion.button>
          </div>

          {/* Master Volume Bar */}
          <div className="w-full px-8 pb-2">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                <span className={cn("text-[10px] tracking-[0.5em] font-black uppercase", isDark ? "text-white/50" : "text-black/40")}>MASTER VOLUME</span>
              </div>
              <span className={cn("text-sm font-black opacity-90", isDark ? "text-white" : "text-black")}>{Math.round(state.volume * 100)}%</span>
            </div>
            <div className="relative w-full h-12 flex items-center cursor-pointer group">
              <div className={cn("absolute w-full h-[6px] rounded-full overflow-hidden border", isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5")}>
                <motion.div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${state.volume * 100}%`, 
                    background: `linear-gradient(90deg, ${primaryColor}77, ${primaryColor})`,
                    boxShadow: state.isPlaying ? `0 0 20px ${primaryColor}` : 'none'
                  }}
                />
              </div>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title="Master Volume"
                aria-label="Master Volume"
              />

              <motion.div 
                className={cn("absolute w-8 h-8 rounded-full border-[6px] z-20 pointer-events-none", isDark ? "bg-white border-[#080808]" : "bg-white border-gray-200 shadow-lg")}
                style={{ 
                  left: `calc(${state.volume * 100}% - 16px)`,
                  boxShadow: isDark ? `0 0 30px ${primaryColor}aa, 0 10px 20px rgba(0,0,0,0.8)` : `0 0 20px ${primaryColor}66, 0 4px 12px rgba(0,0,0,0.1)`
                }}
              />
            </div>
          </div>
        </div>
      </div>

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

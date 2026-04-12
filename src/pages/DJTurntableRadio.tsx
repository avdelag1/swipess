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
  SkipBack, SkipForward, Play, Pause
} from 'lucide-react';

// ── Stars + Shooting Stars Canvas ──────────────────────────────────────────
function RadioStarsCanvas({ accentColor }: { accentColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    interface Star { x: number; y: number; size: number; opacity: number; speed: number; phase: number; glow: boolean; }
    const count = Math.min(Math.floor((w * h) / 800), 500);
    const stars: Star[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 0.75 + 0.15,
      opacity: Math.random() * 0.55 + 0.35,
      speed: Math.random() * 0.01 + 0.001,
      phase: Math.random() * Math.PI * 2,
      glow: Math.random() > 0.85,
    }));

    // 🎨 TURBO CACHE: Pre-render stars to offscreen canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const octx = offscreen.getContext('2d');
    if (octx) {
      for (const s of stars) {
        octx.beginPath();
        octx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        octx.fillStyle = `rgba(255,255,255,${s.opacity * 0.5})`;
        octx.fill();
        if (s.glow) {
          octx.shadowBlur = 4;
          octx.shadowColor = 'rgba(255,255,255,0.8)';
          octx.stroke();
        }
      }
    }

    // Shooting stars
    interface ShootingStar { x: number; y: number; len: number; speed: number; opacity: number; angle: number; life: number; maxLife: number; }
    const shootingStars: ShootingStar[] = [];
    
    // 🚀 SENTIENT TIMING: 6-10s interval regardless of frame rate
    let lastShootTime = performance.now();
    let nextShootDelay = 6000 + Math.random() * 4000;

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      
      // ⚡ DRAW CACHED STARS
      ctx.drawImage(offscreen, 0, 0);

      t += 0.12;
      const now = performance.now();

      // Individual twinkle for a few "hero" stars only (CPU optimization)
      const heroStars = stars.slice(0, 30); 
      for (const s of heroStars) {
        const twinkle = Math.sin(t * s.speed + s.phase) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity * twinkle})`;
        ctx.fill();
      }

      // Spawn shooting stars based on time drift
      if (now - lastShootTime >= nextShootDelay) {
        lastShootTime = now;
        nextShootDelay = 6000 + Math.random() * 4000;
        
        const angle = (Math.PI / 6) + Math.random() * (Math.PI / 4);
        shootingStars.push({
          x: Math.random() * w * 0.8,
          y: Math.random() * h * 0.3,
          len: 60 + Math.random() * 100,
          speed: 4 + Math.random() * 6,
          opacity: 0.7 + Math.random() * 0.3,
          angle,
          life: 0,
          maxLife: 40 + Math.random() * 30,
        });
      }

      // Draw shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        const progress = ss.life / ss.maxLife;
        const fadeAlpha = progress < 0.3 ? progress / 0.3 : 1 - ((progress - 0.3) / 0.7);
        const alpha = ss.opacity * Math.max(0, fadeAlpha);

        const tailX = ss.x - Math.cos(ss.angle) * ss.len;
        const tailY = ss.y - Math.sin(ss.angle) * ss.len;
        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.6, `rgba(255,255,255,${alpha * 0.3})`);
        grad.addColorStop(1, `rgba(255,255,255,${alpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Head glow
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = accentColor;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        if (ss.life >= ss.maxLife) shootingStars.splice(i, 1);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [accentColor]);

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
        <div
          key={i}
          className="w-1 rounded-full transition-all duration-[80ms] ease-out"
          style={{ 
            height: `${Math.max(8, v * 100)}%`,
            background: `linear-gradient(to top, ${color}22, ${color})`, 
            boxShadow: v > 0.6 ? `0 0 12px ${color}88` : 'none',
            opacity: 0.3 + (v * 0.7)
          }}
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
    state, loading, error: _error, play, togglePlayPause, togglePower, changeStation,
    setCity, setVolume, toggleShuffle, toggleFavorite, isStationFavorite,
  } = useRadio();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'cheers';

  const [showDrawer, setShowDrawer] = useState(false);
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState(false);

  const cityTheme = (state.currentCity && cityThemes[state.currentCity]) ? cityThemes[state.currentCity] : cityThemes['tulum'];
  const primaryColor = cityTheme?.primaryColor || '#FF4D00';
  const secondaryColor = cityTheme?.secondaryColor || '#FFB347';

  // POWER ON / INITIALIZATION GUARD — fires exactly once via ref
  const hasInitRef = useRef(false);
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;
    
    if (!state.isPoweredOn) {
      togglePower();
      triggerHaptic('medium');
    }
    if (!state.isPlaying) {
      play();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        "fixed inset-0 z-[9999] flex flex-col overflow-hidden select-none transition-all duration-1000",
        isDark ? "bg-[#030303]" : "bg-[#f8f9fa]"
      )}
    >
      {/* Removed full-screen black loading overlay — radio content always visible */}
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
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Reliable back navigation — always go to the dashboard if no history
            if (window.history.length > 2) {
              navigate(-1);
            } else {
              navigate('/client/dashboard');
            }
          }}
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

        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
          
          {/* 📡 ALL STATIONS: Hexagonal Scanner Look */}
          <motion.button
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setShowDrawer(true); triggerHaptic('medium'); }}
            className={cn(
              "relative w-14 h-14 flex items-center justify-center group",
              "before:absolute before:inset-0 before:bg-white/5 before:backdrop-blur-3xl before:rounded-[35%] before:rotate-45 before:border before:border-white/10 before:transition-transform group-hover:before:rotate-[135deg]",
              "after:absolute after:inset-1 after:border-t after:border-l after:border-orange-500/40 after:rounded-[30%] after:rotate-45 after:transition-all group-hover:after:border-orange-400"
            )}
          >
            <div className="relative z-10 flex flex-col items-center gap-0.5">
              <ListMusic className={cn("w-6 h-6", isDark ? "text-white" : "text-black")} />
              <span className="text-[7px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Stations</span>
            </div>
            
            {/* Pulsing scan line */}
            <motion.div 
              animate={{ top: ['20%', '80%', '20%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/4 right-1/4 h-[1px] bg-orange-500/30 blur-[1px] z-10 pointer-events-none"
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Main turntable area */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-16 overflow-hidden">
        <div className="relative w-full max-w-[340px] flex items-center justify-center mt-2">

          {/* Turntable Platter Wrapper — iOS style scaling */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: state.isPlaying ? 1.05 : 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="relative aspect-square flex items-center justify-center"
            style={{ width: 'min(75vw, 34dvh)' }}
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
                className="absolute inset-[3%] rounded-full shadow-[inset_0_0_80px_rgba(0,0,0,1),0_20px_50px_rgba(0,0,0,1)] flex items-center justify-center will-change-transform"
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
        <div className="mt-6 text-center w-full max-w-[420px] stagger-enter">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStation?.id || 'none'}
              initial={{ opacity: 0, scale: 1.15, y: 15, filter: 'blur(20px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.85, y: -15, filter: 'blur(20px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className={cn("text-3xl sm:text-4xl font-bold tracking-tight drop-shadow-xl", isDark ? "text-white" : "!text-black")}>
                {state.currentStation?.name || 'Radio'}
              </h2>
              <div className="flex items-center justify-center gap-3 mt-2">
                <motion.div 
                  animate={{ scale: state.isPlaying ? [1, 1.25, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: primaryColor, boxShadow: `0 0 15px ${primaryColor}` }} 
                />
                <p className={cn("text-xs tracking-[0.3em] font-bold uppercase text-center", isDark ? "text-white/70" : "!text-black/70")}>
                  {state.currentStation?.genre || 'Broadcast'}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <RadioVisualizer isPlaying={state.isPlaying} color={primaryColor} />
        </div>

        {/* Playback Controls Container */}
        <div className="mt-auto mb-10 flex flex-col items-center gap-5 w-full max-w-[440px] stagger-enter">
          <div className="flex items-center gap-6">
            
            {/* ❤️ SENTIENT PULSAR: Save the Likes/Lights */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => { if (state.currentStation) { toggleFavorite(state.currentStation.id); triggerHaptic('success'); } }}
              className={cn(
                "relative w-16 h-16 rounded-full flex items-center justify-center group overflow-hidden transition-all duration-700",
                isStationFavorite(state.currentStation?.id || '') 
                  ? "bg-transparent ring-2 ring-orange-500/40" 
                  : "bg-white/5 backdrop-blur-3xl border border-white/10"
              )}
            >
              <AnimatePresence>
                {state.currentStation && isStationFavorite(state.currentStation.id) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute inset-0 bg-gradient-to-br from-orange-600 via-rose-600 to-red-700"
                  />
                )}
              </AnimatePresence>
              
              {/* Internal breathing core */}
              <motion.div 
                animate={state.isPlaying ? { scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "absolute inset-2 rounded-full blur-md z-0",
                  state.currentStation && isStationFavorite(state.currentStation.id) ? "bg-white/30" : "bg-orange-500/10"
                )}
              />

              <Heart 
                className={cn("w-8 h-8 relative z-10 transition-all duration-700", isStationFavorite(state.currentStation?.id || '') ? "scale-110" : "scale-100")} 
                fill={state.currentStation && isStationFavorite(state.currentStation.id) ? "white" : "none"} 
                stroke={state.currentStation && isStationFavorite(state.currentStation.id) ? "white" : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)')} 
              />
            </motion.button>

            <div className="flex items-center gap-6">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { changeStation('prev'); triggerHaptic('medium'); }}
                className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all", isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10")}
              >
                <SkipBack className={cn("w-7 h-7", isDark ? "text-white/50" : "text-black/40")} fill="currentColor" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { togglePlayPause(); triggerHaptic('heavy'); }}
                className="w-24 h-24 rounded-full flex items-center justify-center relative shadow-[0_30px_60px_rgba(0,0,0,0.6)] group"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: state.isPlaying ? `0 0 80px ${primaryColor}44, inset 0 2px 20px rgba(255,255,255,0.5)` : `0 15px 30px rgba(0,0,0,0.4)`
                }}
              >
                <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-colors" />
                {state.isPlaying ? <Pause className="w-12 h-12 text-white" fill="white" /> : <Play className="w-12 h-12 text-white ml-2" fill="white" />}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { changeStation('next'); triggerHaptic('medium'); }}
                className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all", isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10")}
              >
                <SkipForward className={cn("w-7 h-7", isDark ? "text-white/50" : "text-black/40")} fill="currentColor" />
              </motion.button>
            </div>

            {/* 💎 MEMORY CRYSTAL: Favorites List Trigger */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => { setShowFavoritesDrawer(true); triggerHaptic('medium'); }}
              className={cn(
                "relative w-16 h-16 flex items-center justify-center overflow-hidden transition-all duration-500",
                "bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[1.8rem]"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-purple-500/10 pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="relative">
                  <ListMusic className={cn("w-8 h-8", isDark ? "text-white/60" : "text-black/40")} />
                  {state.favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full ring-2 ring-[#030303]" />
                  )}
                </div>
                <span className="text-[6px] font-black uppercase tracking-[0.2em] opacity-40">Favorites</span>
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
                  transition={{ duration: 0 }} // Raw speed: no lag for the volume line
                />
              </div>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  // 🚀 SENTIENT FEEDBACK: Light tick every 5% for physical feel
                  if (Math.floor(val * 20) !== Math.floor(state.volume * 20)) {
                    triggerHaptic('light');
                  }
                }}
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
                transition={{ duration: 0 }} // Raw speed: no lag for the handle
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

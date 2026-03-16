/**
 * DJTurntableRadio — Professional DJ turntable radio skin.
 *
 * Features:
 * - CSS-rendered spinning vinyl with grooves & center label
 * - SVG tonearm with framer-motion rotation
 * - Vertical pitch fader mapped to volume
 * - Tactile transport controls (prev, play/pause, next)
 * - City theme-adaptive glow & label colors
 * - Station drawer for browsing
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRadio } from '@/contexts/RadioContext';
import { cityThemes } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { StationDrawer } from '@/components/radio/retro/StationDrawer';
import { triggerHaptic } from '@/utils/haptics';
import {
  ArrowLeft, ListMusic, Heart, Shuffle,
  SkipBack, SkipForward, Play, Pause, Disc3
} from 'lucide-react';

// ── Font injection ──────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('turntable-fonts')) {
  const s = document.createElement('style');
  s.id = 'turntable-fonts';
  s.textContent = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');`;
  document.head.appendChild(s);
}

export default function DJTurntableRadio() {
  const navigate = useNavigate();
  const {
    state, error, play, togglePlayPause, changeStation,
    setCity, setVolume, toggleShuffle, toggleFavorite, isStationFavorite,
  } = useRadio();

  const [showDrawer, setShowDrawer] = useState(false);
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState(false);

  const cityTheme = cityThemes[state.currentCity] || cityThemes['tulum'];

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

  const primaryColor = cityTheme.primaryColor;
  const secondaryColor = cityTheme.secondaryColor;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={{
        background: `radial-gradient(ellipse at 50% 30%, #1a1a1a 0%, #0a0a0a 60%, #050505 100%)`,
      }}
    >
      {/* ── Floating top bar ─────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </motion.button>

        <span
          className="text-xs font-bold tracking-[0.2em] uppercase"
          style={{ color: primaryColor, fontFamily: "'Bebas Neue', sans-serif", fontSize: '14px' }}
        >
          {cityTheme.name}
        </span>

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { toggleShuffle(); triggerHaptic('light'); }}
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center ${state.isShuffle ? 'bg-white/15' : 'bg-white/5'}`}
          >
            <Shuffle className="w-4 h-4 text-white/70" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { triggerHaptic('light'); navigate('/radio/cassette'); }}
            className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center"
            title="Switch to Cassette skin"
          >
            {/* Cassette icon: two circles + tape path */}
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

      {/* ── Main turntable area ──────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-4">

        {/* Turntable deck surface */}
        <div
          className="relative w-full max-w-[340px] aspect-square rounded-2xl"
          style={{
            background: 'linear-gradient(145deg, #1c1c1c 0%, #111111 50%, #0d0d0d 100%)',
            boxShadow: `0 0 60px -20px ${primaryColor}22, inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 60px -10px rgba(0,0,0,0.8)`,
          }}
        >
          {/* Metallic platter ring */}
          <div
            className="absolute inset-3 rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 48%, #2a2a2a 49%, #3a3a3a 50%, #2a2a2a 51%, transparent 52%), radial-gradient(circle, transparent 95%, #333 96%, #222 100%)',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
            }}
          />

          {/* Spinning vinyl record */}
          <motion.div
            className="absolute inset-5 rounded-full"
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
            transition={state.isPlaying ? {
              duration: 1.8,
              ease: 'linear',
              repeat: Infinity,
            } : {
              duration: 0.5,
              ease: 'easeOut',
            }}
          >
            {/* Center label */}
            <div
              className="absolute inset-0 m-auto w-[32%] h-[32%] rounded-full flex flex-col items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}ee, ${secondaryColor}ee)`,
                boxShadow: `0 0 20px ${primaryColor}33`,
              }}
            >
              {/* Spindle hole */}
              <div className="w-2.5 h-2.5 rounded-full bg-black/60 mb-1 border border-white/10" />
              <p
                className="text-[7px] font-bold text-white/90 text-center leading-tight px-1 truncate max-w-full"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}
              >
                {state.currentStation?.name || 'NO SIGNAL'}
              </p>
              <p className="text-[5px] text-white/50 tracking-wider uppercase">
                {state.currentStation?.frequency || '---'}
              </p>
            </div>

            {/* Light reflection on vinyl */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.02) 100%)',
              }}
            />
          </motion.div>

          {/* ── Tonearm ────────────────────────────────────────── */}
          <motion.div
            className="absolute -right-2 -top-2 w-32 h-32 origin-[85%_15%]"
            style={{ zIndex: 10 }}
            animate={{ rotate: state.isPlaying ? 22 : 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          >
            <svg viewBox="0 0 120 120" className="w-full h-full">
              {/* Pivot base */}
              <circle cx="100" cy="18" r="8" fill="#333" stroke="#444" strokeWidth="1" />
              <circle cx="100" cy="18" r="4" fill="#555" />

              {/* Arm */}
              <line x1="100" y1="18" x2="30" y2="90" stroke="#aaa" strokeWidth="2.5"
                strokeLinecap="round" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />

              {/* Headshell */}
              <rect x="22" y="85" width="18" height="6" rx="1" fill="#888"
                transform="rotate(-42, 30, 90)"
                style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }} />

              {/* Cartridge */}
              <rect x="18" y="92" width="8" height="4" rx="0.5" fill={primaryColor}
                transform="rotate(-42, 30, 90)" />

              {/* Stylus */}
              <line x1="20" y1="96" x2="17" y2="99" stroke="#ddd" strokeWidth="0.8"
                transform="rotate(-42, 30, 90)" />
            </svg>
          </motion.div>

          {/* Playing glow under platter */}
          <AnimatePresence>
            {state.isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  boxShadow: `0 0 80px -20px ${primaryColor}44, inset 0 0 40px -15px ${primaryColor}11`,
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── Station info ─────────────────────────────────── */}
        <div className="mt-5 text-center w-full max-w-[340px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStation?.id || 'none'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <h2
                className="text-white text-lg font-bold tracking-tight"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.04em' }}
              >
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

        {/* ── Controls + Pitch Fader row ─────────────────── */}
        <div className="mt-6 flex items-center gap-5 w-full max-w-[340px] justify-center">

          {/* Favorite button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              if (state.currentStation) {
                toggleFavorite(state.currentStation.id);
                triggerHaptic('light');
              }
            }}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
          >
            <Heart
              className="w-4 h-4"
              fill={state.currentStation && isStationFavorite(state.currentStation.id) ? primaryColor : 'none'}
              stroke={state.currentStation && isStationFavorite(state.currentStation.id) ? primaryColor : 'rgba(255,255,255,0.4)'}
            />
          </motion.button>

          {/* Transport controls */}
          <div className="flex items-center gap-3">
            {/* Prev */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => { changeStation('prev'); triggerHaptic('medium'); }}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #222, #1a1a1a)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <SkipBack className="w-5 h-5 text-white/70" fill="currentColor" />
            </motion.button>

            {/* Play / Pause — large center button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => { togglePlayPause(); triggerHaptic('medium'); }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: `linear-gradient(145deg, ${primaryColor}dd, ${primaryColor}88)`,
                boxShadow: `0 8px 24px ${primaryColor}44, inset 0 1px 0 rgba(255,255,255,0.15)`,
              }}
            >
              {state.isPlaying ? (
                <Pause className="w-7 h-7 text-white" fill="white" />
              ) : (
                <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
              )}
              {/* Button surface shine */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 50%)',
              }} />
            </motion.button>

            {/* Next */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => { changeStation('next'); triggerHaptic('medium'); }}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #222, #1a1a1a)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <SkipForward className="w-5 h-5 text-white/70" fill="currentColor" />
            </motion.button>
          </div>

          {/* ── Pitch Fader (Volume) ──────────────────────── */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] text-white/30 tracking-[0.15em] uppercase font-bold"
              style={{ fontFamily: "'Space Mono', monospace" }}>
              PITCH
            </span>
            <div
              className="relative w-8 h-28 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #1a1a1a, #111)',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              {/* Track groove */}
              <div className="absolute w-[2px] h-[85%] rounded-full bg-white/10" />

              {/* Center detent mark */}
              <div className="absolute w-4 h-[1px] bg-white/15 left-1/2 top-1/2 -translate-x-1/2" />

              {/* Fader knob */}
              <motion.div
                className="absolute w-6 h-5 rounded-sm cursor-grab active:cursor-grabbing"
                style={{
                  background: `linear-gradient(180deg, #444, #2a2a2a)`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                  top: `${(1 - state.volume) * 75 + 8}%`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
                drag="y"
                dragConstraints={{ top: -40, bottom: 40 }}
                dragElastic={0}
                dragMomentum={false}
                onDrag={(_, info) => {
                  // Map drag position to volume (inverted: up = louder)
                  const parentHeight = 112; // h-28 = 7rem = 112px
                  const normalizedY = info.point.y;
                  // Use offset to calculate relative volume change
                  const delta = -info.delta.y / parentHeight;
                  setVolume(Math.max(0, Math.min(1, state.volume + delta)));
                }}
              >
                {/* Knob grip lines */}
                <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 space-y-[2px]">
                  <div className="h-[1px] bg-white/15" />
                  <div className="h-[1px] bg-white/10" />
                  <div className="h-[1px] bg-white/15" />
                </div>
              </motion.div>

              {/* Volume percentage */}
              <span
                className="absolute -bottom-4 text-[7px] text-white/25"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {Math.round(state.volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error toast ──────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-14 left-4 right-4 z-50 text-center"
          >
            <span
              className="inline-block px-4 py-2 rounded-full text-xs font-medium text-red-300"
              style={{
                background: 'rgba(0,0,0,0.85)',
                border: '1px solid rgba(255,59,48,0.3)',
              }}
            >
              {error}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Station Drawer ───────────────────────────────── */}
      <StationDrawer
        isOpen={showDrawer || showFavoritesDrawer}
        onClose={() => {
          setShowDrawer(false);
          setShowFavoritesDrawer(false);
        }}
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

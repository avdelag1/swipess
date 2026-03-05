/**
 * RetroRadioStation — Full-screen cassette player.
 *
 * The HD cassette photo fills the viewport (portrait-first).
 * Station name is overlaid on the cassette label.
 * Visible, beautiful retro-styled controls are arranged around the cassette.
 *
 * Layout (top → bottom):
 *  ┌─────────────────────────────────┐
 *  │  ← Back           🎵 Stations  │  ← header bar
 *  │                                 │
 *  │  ┌───────────────────────────┐  │
 *  │  │                           │  │
 *  │  │     CASSETTE IMAGE        │  │  ← full-width, high opacity
 *  │  │   (station name on label) │  │
 *  │  │                           │  │
 *  │  └───────────────────────────┘  │
 *  │                                 │
 *  │      Station Name               │  ← now playing info
 *  │      Genre · Frequency          │
 *  │                                 │
 *  │  ⏮    ⏪    ▶/⏸    ⏩    ⏭   │  ← control buttons
 *  │                                 │
 *  │  🔈 ━━━━━━━━━━━━━━━━━━━━ 🔊  │  ← volume slider
 *  │                                 │
 *  │  ♥ Save   📻 ON AIR            │  ← bottom bar
 *  └─────────────────────────────────┘
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
  ArrowLeft, ListMusic, Play, Pause, Heart,
  SkipBack, SkipForward, Shuffle, Volume2,
  VolumeX, Volume1, Radio, Disc3,
} from 'lucide-react';

// ── Font injection ─────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('cassette-radio-fonts')) {
  const style = document.createElement('style');
  style.id = 'cassette-radio-fonts';
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Space+Mono:wght@400;700&display=swap');
  `;
  document.head.appendChild(style);
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function RetroRadioStation() {
  const navigate = useNavigate();
  const {
    state, error,
    togglePlayPause, changeStation,
    setCity, setVolume, toggleShuffle,
    toggleFavorite, isStationFavorite,
    play, setMiniPlayerMode,
  } = useRadio();

  useEffect(() => { setMiniPlayerMode('expanded'); }, [setMiniPlayerMode]);

  const [showDrawer, setShowDrawer] = useState(false);
  const cityTheme = cityThemes[state.currentCity];
  const isFav = state.currentStation ? isStationFavorite(state.currentStation.id) : false;
  const stationName = state.currentStation?.name ?? 'SwipesS FM';
  const genre = state.currentStation?.genre ?? 'Radio';
  const frequency = state.currentStation?.frequency ?? '98.5 FM';

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') { e.preventDefault(); togglePlayPause(); }
      else if (e.key === 'ArrowRight') changeStation('next');
      else if (e.key === 'ArrowLeft') changeStation('prev');
      else if (e.key === 'ArrowUp') { e.preventDefault(); setVolume(Math.min(1, state.volume + 0.1)); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setVolume(Math.max(0, state.volume - 0.1)); }
      else if (e.key === 'm' || e.key === 'M') setShowDrawer(p => !p);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [togglePlayPause, changeStation, setVolume, state.volume]);

  // ── Drawer callbacks ─────────────────────────────────────────────────────────
  const handleCitySelect = useCallback((city: CityLocation) => setCity(city), [setCity]);
  const handleStationSelect = useCallback((s: any) => play(s), [play]);

  const VolumeIcon = state.volume === 0 ? VolumeX : state.volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 20%, ${cityTheme.primaryColor}18 0%, transparent 60%),
          radial-gradient(ellipse at 80% 80%, ${cityTheme.secondaryColor}12 0%, transparent 50%),
          linear-gradient(180deg, #0c0c0c 0%, #050505 50%, #0a0a0a 100%)
        `,
        touchAction: 'none',
      }}
    >

      {/* ═══════════════════════════════════════════════════════
          HEADER BAR
          ═══════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-2 z-20">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </motion.button>

        {/* Center: ON AIR indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{
              background: state.isPlaying ? '#ff3b30' : 'rgba(255,255,255,0.15)',
              boxShadow: state.isPlaying ? '0 0 8px #ff3b30, 0 0 20px rgba(255,59,48,0.4)' : 'none',
            }}
            animate={state.isPlaying ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span
            className="text-[10px] tracking-[0.2em] uppercase font-semibold"
            style={{
              color: state.isPlaying ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {state.isPlaying ? 'ON AIR' : 'OFF AIR'}
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setShowDrawer(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          aria-label="Browse stations"
        >
          <ListMusic className="w-5 h-5 text-white/60" />
        </motion.button>
      </div>


      {/* ═══════════════════════════════════════════════════════
          CASSETTE IMAGE — fills the available space
          ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center px-4 py-2 relative min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStation?.id ?? 'empty'}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full h-full flex items-center justify-center"
          >
            {/* The cassette image — full opacity, fills container */}
            <motion.img
              src="/images/retro-cassette-hd.png"
              alt="Retro Cassette"
              draggable={false}
              className="max-w-full max-h-full object-contain"
              style={{
                filter: `
                  drop-shadow(0 8px 40px rgba(0,0,0,0.6))
                  drop-shadow(0 0 60px ${cityTheme.primaryColor}20)
                `,
                width: '100%',
                height: '100%',
              }}
              animate={{
                scale: state.isPlaying ? [1, 1.005, 1] : 1,
                rotate: state.isPlaying ? [0, 0.3, -0.3, 0] : 0,
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Station name overlay on the cassette label area */}
            <div
              className="absolute flex flex-col items-center justify-center pointer-events-none"
              style={{
                top: '18%',
                left: '22%',
                right: '22%',
                height: '20%',
              }}
            >
              <span
                className="text-center leading-tight truncate w-full"
                style={{
                  fontFamily: "'Permanent Marker', cursive",
                  fontSize: 'clamp(14px, 4.5vw, 28px)',
                  fontWeight: 900,
                  color: '#1a1a2e',
                  textShadow: '0 1px 2px rgba(255,255,255,0.3)',
                  letterSpacing: '0.02em',
                }}
              >
                {stationName}
              </span>
              <span
                className="mt-0.5"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 'clamp(7px, 1.8vw, 11px)',
                  fontWeight: 700,
                  color: '#555',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                }}
              >
                {genre}
              </span>
            </div>

            {/* Ambient glow behind cassette when playing */}
            {state.isPlaying && (
              <motion.div
                className="absolute inset-0 pointer-events-none -z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  background: `
                    radial-gradient(ellipse at 50% 50%, ${cityTheme.primaryColor}12 0%, transparent 60%)
                  `,
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>


      {/* ═══════════════════════════════════════════════════════
          NOW PLAYING INFO
          ═══════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 text-center px-6 pb-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStation?.id ?? 'none'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <h2
              className="text-white font-bold tracking-tight leading-tight"
              style={{ fontSize: 'clamp(16px, 4vw, 22px)' }}
            >
              {stationName}
            </h2>
            <p className="text-white/40 text-xs mt-0.5 flex items-center justify-center gap-1.5">
              <span>{cityTheme.name}</span>
              <span className="text-white/20">·</span>
              <span>{genre}</span>
              <span className="text-white/20">·</span>
              <Disc3 className="w-3 h-3 text-white/25 inline" />
              <span className="font-mono text-[10px] text-white/30">{frequency}</span>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>


      {/* ═══════════════════════════════════════════════════════
          TRANSPORT CONTROLS
          The main player buttons styled like retro cassette controls
          ═══════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex items-center justify-center gap-4 px-6 py-4">

        {/* Shuffle */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => { triggerHaptic('light'); toggleShuffle(); }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: state.isShuffle
              ? `linear-gradient(135deg, ${cityTheme.primaryColor}35, ${cityTheme.secondaryColor}25)`
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${state.isShuffle ? cityTheme.primaryColor + '40' : 'rgba(255,255,255,0.06)'}`,
            boxShadow: state.isShuffle ? `0 0 16px ${cityTheme.primaryColor}20` : 'none',
          }}
          aria-label="Shuffle"
        >
          <Shuffle className={`w-4 h-4 ${state.isShuffle ? 'text-white' : 'text-white/40'}`} />
        </motion.button>

        {/* Previous */}
        <motion.button
          whileTap={{ scale: 0.82 }}
          onClick={() => { triggerHaptic('light'); changeStation('prev'); }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
          aria-label="Previous station"
        >
          <SkipBack className="w-5 h-5 text-white/70" fill="currentColor" />
        </motion.button>

        {/* PLAY / PAUSE — the big center button */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.04 }}
          onClick={() => { triggerHaptic('medium'); togglePlayPause(); }}
          className="w-16 h-16 rounded-full flex items-center justify-center relative"
          style={{
            background: `linear-gradient(145deg, ${cityTheme.primaryColor}, ${cityTheme.secondaryColor})`,
            boxShadow: `
              0 6px 28px ${cityTheme.primaryColor}60,
              0 2px 8px rgba(0,0,0,0.4),
              inset 0 1px 0 rgba(255,255,255,0.25),
              inset 0 -2px 4px rgba(0,0,0,0.2)
            `,
          }}
          aria-label={state.isPlaying ? 'Pause' : 'Play'}
        >
          {/* Outer ring glow */}
          {state.isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                border: `2px solid ${cityTheme.primaryColor}`,
              }}
            />
          )}
          {state.isPlaying ? (
            <Pause className="w-7 h-7 text-white" fill="white" />
          ) : (
            <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
          )}
        </motion.button>

        {/* Next */}
        <motion.button
          whileTap={{ scale: 0.82 }}
          onClick={() => { triggerHaptic('light'); changeStation('next'); }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
          aria-label="Next station"
        >
          <SkipForward className="w-5 h-5 text-white/70" fill="currentColor" />
        </motion.button>

        {/* Favorite */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => {
            triggerHaptic('success');
            state.currentStation && toggleFavorite(state.currentStation.id);
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: isFav
              ? `linear-gradient(135deg, ${cityTheme.primaryColor}35, ${cityTheme.secondaryColor}25)`
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isFav ? cityTheme.primaryColor + '40' : 'rgba(255,255,255,0.06)'}`,
            boxShadow: isFav ? `0 0 16px ${cityTheme.primaryColor}20` : 'none',
          }}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isFav ? 'text-white fill-white' : 'text-white/40'}`}
          />
        </motion.button>
      </div>


      {/* ═══════════════════════════════════════════════════════
          VOLUME SLIDER
          ═══════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex items-center gap-3 px-8 pb-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setVolume(state.volume > 0 ? 0 : 0.7)}
          aria-label={state.volume > 0 ? 'Mute' : 'Unmute'}
        >
          <VolumeIcon className="w-4 h-4 text-white/35" />
        </motion.button>

        <div className="flex-1 relative h-8 flex items-center">
          {/* Track background */}
          <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/[0.06]">
            {/* Fill */}
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{
                width: `${state.volume * 100}%`,
                background: `linear-gradient(90deg, ${cityTheme.primaryColor}, ${cityTheme.secondaryColor})`,
                boxShadow: `0 0 8px ${cityTheme.primaryColor}50`,
              }}
            />
          </div>

          {/* Invisible touch target for full-width interaction */}
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(state.volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Volume"
          />

          {/* Visual thumb */}
          <div
            className="absolute w-3 h-3 rounded-full bg-white pointer-events-none"
            style={{
              left: `calc(${state.volume * 100}% - 6px)`,
              boxShadow: `0 0 8px ${cityTheme.primaryColor}60, 0 1px 4px rgba(0,0,0,0.4)`,
            }}
          />
        </div>

        <span className="text-[9px] text-white/25 w-7 text-right font-mono tabular-nums flex-shrink-0">
          {Math.round(state.volume * 100)}%
        </span>
      </div>


      {/* ═══════════════════════════════════════════════════════
          BOTTOM SAFE AREA + Error toast
          ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex-shrink-0 px-6 pb-2"
          >
            <p className="text-red-400/70 text-xs text-center font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-shrink-0 h-6" />


      {/* ═══════════════════════════════════════════════════════
          STATION DRAWER
          ═══════════════════════════════════════════════════════ */}
      <StationDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
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

/**
 * RetroRadioStation — IMMERSIVE full-screen cassette player.
 *
 * The cassette player photo fills the ENTIRE viewport edge-to-edge.
 * All controls are invisible hotspot buttons positioned exactly over
 * the physical buttons visible in the cassette player photograph.
 * Dynamic text (station name, genre) is composited onto the label area.
 *
 * IMAGE LAYOUT (cassette-player-bg.png)
 * ─────────────────────────────────────────────────
 *  Top 0-25%    : Label area (cream/white with red stripes)
 *                 → Station name overlay goes here
 *  25-60%       : Tape window with visible reels
 *                 → Animated reel glow overlay when playing
 *  60-70%       : Button labels (REWIND, PLAY, etc)
 *  70-88%       : Physical button row
 *                 → REWIND (left),  PLAY,  FF,  STOP,  RECORD (right)
 *                 → Mapped to: prev, play/pause, next, browse, favorite
 *  88-100%      : Volume knob area
 *                 → Tap left/right of center to decrease/increase volume
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
  ArrowLeft, ListMusic, Play, Pause, ThumbsUp,
  SkipBack, SkipForward, Square, Shuffle
} from 'lucide-react';

// ── Font injection ──────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('cassette-radio-fonts')) {
  const s = document.createElement('style');
  s.id = 'cassette-radio-fonts';
  s.textContent = `@import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Space+Mono:wght@400;700&display=swap');`;
  document.head.appendChild(s);
}

// ── Hotspot button ──────────────────────────────────────────────────────────
// Renders an invisible button positioned over a physical button in the photo.
// A brief visual flash on tap gives tactile feedback.
function Hotspot({
  top, left, right, width, height,
  onClick, label, showFlash = true,
  children,
}: {
  top: string; left?: string; right?: string;
  width: string; height: string;
  onClick: () => void; label: string;
  showFlash?: boolean;
  children?: React.ReactNode;
}) {
  const [flash, setFlash] = useState(false);

  const handleClick = () => {
    onClick();
    if (showFlash) {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
    }
  };

  return (
    <motion.button
      aria-label={label}
      whileTap={{ scale: 0.93 }}
      onClick={handleClick}
      style={{
        position: 'absolute',
        top, left, right, width, height,
        background: flash ? 'rgba(255,255,255,0.12)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        borderRadius: 4,
        transition: 'background 0.15s ease',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </motion.button>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function RetroRadioStation() {
  const navigate = useNavigate();
  const {
    state, error,
    togglePlayPause, changeStation,
    setCity, setVolume,
    toggleFavorite, isStationFavorite,
    play, setMiniPlayerMode, toggleShuffle
  } = useRadio();

  useEffect(() => { setMiniPlayerMode('expanded'); }, [setMiniPlayerMode]);

  const [showDrawer, setShowDrawer] = useState(false);
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState(false);

  const cityTheme = cityThemes[state.currentCity] || cityThemes['new-york'];
  const isFav = state.currentStation ? isStationFavorite(state.currentStation.id) : false;
  const genre = state.currentStation?.genre ?? 'Radio';

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') { e.preventDefault(); togglePlayPause(); }
      else if (e.key === 'ArrowRight') changeStation('next');
      else if (e.key === 'ArrowLeft') changeStation('prev');
      else if (e.key === 'ArrowUp') { e.preventDefault(); setVolume(Math.min(1, state.volume + 0.1)); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setVolume(Math.max(0, state.volume - 0.1)); }
      else if (e.key === 'm' || e.key === 'M') { setShowFavoritesDrawer(false); setShowDrawer(p => !p); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [togglePlayPause, changeStation, setVolume, state.volume]);

  const handleCitySelect = useCallback((city: CityLocation) => setCity(city), [setCity]);
  const handleStationSelect = useCallback((s: any) => play(s), [play]);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: '#0a0a0a', touchAction: 'none' }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          THE CASSETTE PLAYER IMAGE — fills the ENTIRE screen
          object-fit: cover ensures no gaps, image crops to fill viewport
          ═══════════════════════════════════════════════════════════════════ */}
      <img
        src="/images/cassette-player-bg.png"
        alt="Cassette Player"
        draggable={false}
        className="absolute inset-0 w-full h-full select-none"
        style={{
          objectFit: 'cover',
          objectPosition: 'center center',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle color tint overlay from city theme */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(180deg, ${cityTheme.primaryColor}08 0%, transparent 30%),
            linear-gradient(0deg, rgba(0,0,0,0.3) 0%, transparent 15%)
          `,
          mixBlendMode: 'overlay',
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          CITY NAME — overlaid on the cassette label area (top ~5-22%)
          Uses the cream/white label area of the cassette image as background.
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="absolute flex flex-col items-center justify-center pointer-events-none z-10"
        style={{
          top: '15%',
          left: '10%',
          right: '10%',
          height: '14%',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentCity}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-1"
          >
            <span
              style={{
                fontFamily: "'Permanent Marker', cursive",
                fontSize: 'clamp(24px, 8vw, 42px)',
                color: '#1a1a1a',
                textShadow: '0 1px 2px rgba(255,255,255,0.2)',
                letterSpacing: '0.04em',
                lineHeight: 1.1,
                textAlign: 'center',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {cityTheme.name}
            </span>
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 'clamp(9px, 2.5vw, 14px)',
                fontWeight: 700,
                color: '#444',
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
              }}
            >
              {genre} · MIX
            </span>
          </motion.div>
        </AnimatePresence>
      </div>


      {/* ═══════════════════════════════════════════════════════════════════
          TAPE REEL GLOW — animated glow on the tape window when playing
          ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {state.isPlaying && (
          <>
            {/* Left reel glow */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3], rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 2, repeat: Infinity },
                rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
              }}
              style={{
                top: '33%',
                left: '22%',
                width: '15%',
                height: '15%',
                background: `radial-gradient(circle, ${cityTheme.primaryColor}30, transparent 70%)`,
                boxShadow: `0 0 20px ${cityTheme.primaryColor}20`,
              }}
            />
            {/* Right reel glow */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3], rotate: -360 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 2, repeat: Infinity, delay: 0.5 },
                rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
              }}
              style={{
                top: '33%',
                right: '22%',
                width: '15%',
                height: '15%',
                background: `radial-gradient(circle, ${cityTheme.secondaryColor}30, transparent 70%)`,
                boxShadow: `0 0 20px ${cityTheme.secondaryColor}20`,
              }}
            />
          </>
        )}
      </AnimatePresence>


      {/* ON AIR indicator — glowing red dot on the tape window */}
      <motion.div
        className="absolute pointer-events-none z-10"
        style={{
          top: '56%',
          right: '12%',
          width: 'clamp(6px, 2vw, 12px)',
          height: 'clamp(6px, 2vw, 12px)',
          borderRadius: '50%',
          background: state.isPlaying ? '#ff2020' : '#330000',
          boxShadow: state.isPlaying
            ? '0 0 8px #ff2020, 0 0 20px rgba(255,32,32,0.6)'
            : 'none',
        }}
        animate={state.isPlaying ? { opacity: [1, 0.2, 1] } : { opacity: 0.3 }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />

      {/* ON AIR text */}
      {state.isPlaying && (
        <motion.span
          className="absolute pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          style={{
            top: '57%',
            right: '16%',
            fontFamily: "'Space Mono', monospace",
            fontSize: 'clamp(6px, 1.5vw, 10px)',
            fontWeight: 700,
            color: '#ff3b30',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            textShadow: '0 0 8px rgba(255,59,48,0.5)',
          }}
        >
          ON AIR
        </motion.span>
      )}


      {/* ═══════════════════════════════════════════════════════════════════
          HOTSPOT BUTTONS WITH NEON ICONS
          Positioned EXACTLY over the physical buttons in the photo.
          Now with electric glowing neon icons directly on the buttons.
          ═══════════════════════════════════════════════════════════════════ */}

      {/* REWIND → Previous station */}
      <Hotspot
        top="64.5%" left="6%" width="17%" height="16%"
        onClick={() => { triggerHaptic('light'); changeStation('prev'); }}
        label="Previous station (Rewind)"
      >
        <SkipBack className="w-7 h-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" fill="rgba(255,255,255,0.8)" />
      </Hotspot>

      {/* PLAY → Play / Pause */}
      <Hotspot
        top="64.5%" left="25%" width="16%" height="16%"
        onClick={() => { triggerHaptic('medium'); togglePlayPause(); }}
        label={state.isPlaying ? 'Pause' : 'Play'}
      >
        {state.isPlaying ? (
          // Electric Cyan for Pause
          <Pause className="w-8 h-8 text-[#00f0ff] drop-shadow-[0_0_16px_#00f0ff]" fill="#00f0ff" />
        ) : (
          // Neon Green for Play
          <Play className="w-8 h-8 text-[#39ff14] drop-shadow-[0_0_16px_#39ff14]" fill="#39ff14" />
        )}
      </Hotspot>

      {/* FAST FORWARD → Next station */}
      <Hotspot
        top="64.5%" left="43%" width="16%" height="16%"
        onClick={() => { triggerHaptic('light'); changeStation('next'); }}
        label="Next station (Fast Forward)"
      >
        <SkipForward className="w-7 h-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" fill="rgba(255,255,255,0.8)" />
      </Hotspot>

      {/* STOP/EJECT → Open station drawer */}
      <Hotspot
        top="64.5%" left="61%" width="17%" height="16%"
        onClick={() => { triggerHaptic('light'); setShowFavoritesDrawer(false); setShowDrawer(true); }}
        label="Browse stations (Stop/Eject)"
      >
        {/* Neon Amber for Stop/Menu */}
        <Square className="w-6 h-6 text-[#ffbf00] drop-shadow-[0_0_12px_#ffbf00]" fill="#ffbf00" />
      </Hotspot>

      {/* RECORD → Favorite / Save */}
      <Hotspot
        top="64.5%" left="81%" width="14%" height="16%"
        onClick={() => {
          triggerHaptic('success');
          if (state.currentStation) toggleFavorite(state.currentStation.id);
        }}
        label={isFav ? 'Remove from favorites' : 'Save station (Record)'}
      >
        {/* Neon Pink for Record/Favorite */}
        <ThumbsUp
          className={`w-6 h-6 transition-colors duration-300 drop-shadow-[0_0_12px_#ff00ff] ${isFav ? 'text-[#ff00ff]' : 'text-white/80 drop-shadow-none'}`}
          fill={isFav ? '#ff00ff' : 'transparent'}
        />
      </Hotspot>

      {/* VOLUME KNOB — tap left half to decrease, right half to increase */}
      <Hotspot
        top="87%" left="0%" width="50%" height="13%"
        onClick={() => {
          triggerHaptic('light');
          setVolume(Math.max(0, state.volume - 0.1));
        }}
        label="Volume down"
      />
      <Hotspot
        top="87%" left="50%" width="50%" height="13%"
        onClick={() => {
          triggerHaptic('light');
          setVolume(Math.min(1, state.volume + 0.1));
        }}
        label="Volume up"
      />

      {/* Tap the label area to browse stations */}
      <Hotspot
        top="2%" left="5%" width="90%" height="22%"
        onClick={() => { triggerHaptic('light'); setShowFavoritesDrawer(false); setShowDrawer(true); }}
        label="Browse stations"
        showFlash={false}
      />

      {/* Volume indicator overlay on the knob area */}
      <div
        className="absolute pointer-events-none z-10 flex flex-col items-center justify-center"
        style={{
          bottom: '1%',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 'clamp(8px, 2.5vw, 14px)',
            fontWeight: 700,
            color: cityTheme.primaryColor,
            textShadow: `0 0 10px ${cityTheme.primaryColor}, 0 1px 3px rgba(0,0,0,0.8)`,
            letterSpacing: '0.15em',
          }}
        >
          VOL {Math.round(state.volume * 10)}
        </span>
      </div>


      {/* ═══════════════════════════════════════════════════════════════════
          FLOATING CHROME — small utility buttons at the corners
          Fixed to viewport, always accessible.
          ═══════════════════════════════════════════════════════════════════ */}

      {/* Back button — top-left */}
      <motion.button
        aria-label="Go back"
        whileTap={{ scale: 0.85 }}
        onClick={() => navigate(-1)}
        className="fixed top-3 left-3 z-50 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <ArrowLeft className="w-4 h-4 text-white/70" />
      </motion.button>

      {/* Liked Stations — top-right next to station list */}
      <motion.button
        aria-label="Liked stations"
        whileTap={{ scale: 0.85 }}
        onClick={() => {
          setShowDrawer(false);
          setShowFavoritesDrawer(true);
        }}
        className="fixed top-3 right-14 z-50 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,0,255,0.3)',
        }}
      >
        <ThumbsUp className="w-4 h-4 text-[#ff00ff] drop-shadow-[0_0_6px_#ff00ff]" fill="#ff00ff" />
      </motion.button>

      {/* Station list — top-right */}
      <motion.button
        aria-label="Browse stations"
        whileTap={{ scale: 0.85 }}
        onClick={() => {
          setShowFavoritesDrawer(false);
          setShowDrawer(true);
        }}
        className="fixed top-3 right-3 z-50 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <ListMusic className="w-4 h-4 text-white/70" />
      </motion.button>

      {/* Skin toggle — switch to turntable — left of shuffle */}
      <motion.button
        aria-label="Switch to Turntable skin"
        whileTap={{ scale: 0.85 }}
        onClick={() => { triggerHaptic('light'); navigate('/radio'); }}
        className="fixed top-3 right-[10rem] z-50 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <circle cx="12" cy="12" r="3"/>
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
        </svg>
      </motion.button>

      {/* Shuffle button — top-right */}
      <motion.button
        aria-label="Toggle shuffle"
        whileTap={{ scale: 0.85 }}
        onClick={() => {
          triggerHaptic('light');
          toggleShuffle();
        }}
        className="fixed top-3 right-[6.5rem] z-50 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          background: 'rgba(0,0,0,0.7)',
          border: state.isShuffle ? `1px solid ${cityTheme.primaryColor}` : '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Shuffle
          className="w-4 h-4 transition-colors"
          style={{
            color: state.isShuffle ? cityTheme.primaryColor : 'rgba(255,255,255,0.4)',
            filter: state.isShuffle ? `drop-shadow(0 0 6px ${cityTheme.primaryColor})` : 'none',
          }}
        />
      </motion.button>

      {/* Error toast */}
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

      {/* Station Drawer */}
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

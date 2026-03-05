/**
 * RetroRadioStation — Full-screen cassette skin.
 *
 * The entire UI IS the cassette image.  Nothing else renders behind it except
 * pure black.  All interactive controls are invisible hotspots positioned
 * exactly over the buttons that are already painted in the cassette photo.
 * Dynamic content (station name, ON AIR led, play-state icon, saved badge)
 * is composited on top via absolutely-positioned overlays.
 *
 * CASSETTE IMAGE COORDINATES  (1168 × 784 source)
 * ─────────────────────────────────────────────────
 *  Label area       top 10.5 %  h 29 %   left 8 %   right 8 %
 *  Skip back ◄◄     top 40 %    h 25 %   left  3 %  w 11 %
 *  Skip fwd  ►► ◄   top 40 %    h 25 %   right 3 %  w 11 %
 *  SAVE SESSION     top 59 %    h 14 %   left  9 %  w 21 %
 *  Prev |◄          top 61 %    h 13 %   left 32 %  w  8 %
 *  Play/Pause ⬤     top 59 %    h 18 %   left 43 %  w 14 %
 *  Next ►|          top 61 %    h 13 %   left 59 %  w  8 %
 *  ON AIR           top 59 %    h 14 %   left 76 %  w 15 %
 *  Volume +         top 79 %    h 12 %   left  3 %  w  9 %
 *  Volume −         top 79 %    h 12 %   right 3 %  w  9 %
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRadio } from '@/contexts/RadioContext';
import { cityThemes } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { StationDrawer } from '@/components/radio/retro/StationDrawer';
import { ArrowLeft, ListMusic, Play, Pause, Heart } from 'lucide-react';

// ── helpers ────────────────────────────────────────────────────────────────────

/** The original image is 1168 × 784 (≈ 1.4898 : 1) */
const IMG_W = 1168;
const IMG_H = 784;
const RATIO = IMG_W / IMG_H; // ~1.49

/** Compute the largest rect with ratio RATIO that fits inside (vw × vh). */
function cassetteDims(vw: number, vh: number): { w: number; h: number } {
  if (vw / vh > RATIO) {
    return { w: Math.round(vh * RATIO), h: vh };
  }
  return { w: vw, h: Math.round(vw / RATIO) };
}

/** useWindowSize — updates on resize */
function useWindowSize() {
  const [size, setSize] = useState(() => ({
    vw: typeof window !== 'undefined' ? window.innerWidth  : 390,
    vh: typeof window !== 'undefined' ? window.innerHeight : 844,
  }));
  useEffect(() => {
    const onResize = () => setSize({ vw: window.innerWidth, vh: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

// ── Invisible hotspot button ───────────────────────────────────────────────────
// Renders nothing visible; the image already shows the button art.
// `whileTap` gives a brief scale-dip as tactile confirmation.
function Hotspot({
  top, left, right, bottom, width, height,
  onClick, label, tapScale = 0.92,
}: {
  top?: string; left?: string; right?: string; bottom?: string;
  width: string; height: string;
  onClick: () => void; label: string; tapScale?: number;
}) {
  return (
    <motion.button
      aria-label={label}
      whileTap={{ scale: tapScale, transition: { type: 'spring', stiffness: 500, damping: 30 } }}
      onClick={onClick}
      style={{
        position: 'absolute',
        top, left, right, bottom,
        width, height,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        // Debug: set to 'rgba(255,0,0,0.25)' to visualise hotspot boundaries
        // background: 'rgba(255,0,0,0.18)',
      }}
    />
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function RetroRadioStation() {
  const navigate = useNavigate();
  const {
    state, error,
    togglePlayPause, changeStation,
    setCity, setVolume,
    toggleFavorite, isStationFavorite,
    play, setMiniPlayerMode,
  } = useRadio();

  useEffect(() => { setMiniPlayerMode('expanded'); }, [setMiniPlayerMode]);

  const [showDrawer, setShowDrawer] = useState(false);
  const { vw, vh } = useWindowSize();
  const { w: cw, h: ch } = cassetteDims(vw, vh);

  const cityTheme = cityThemes[state.currentCity];
  const isFav = state.currentStation ? isStationFavorite(state.currentStation.id) : false;
  const stationName = state.currentStation?.name  ?? 'SwipesS FM';
  const genre       = state.currentStation?.genre ?? 'Radio';

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ')          { e.preventDefault(); togglePlayPause(); }
      else if (e.key === 'ArrowRight') changeStation('next');
      else if (e.key === 'ArrowLeft')  changeStation('prev');
      else if (e.key === 'ArrowUp')    { e.preventDefault(); setVolume(Math.min(1, state.volume + 0.1)); }
      else if (e.key === 'ArrowDown')  { e.preventDefault(); setVolume(Math.max(0, state.volume - 0.1)); }
      else if (e.key === 'm' || e.key === 'M') setShowDrawer(p => !p);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [togglePlayPause, changeStation, setVolume, state.volume]);

  // ── Drawer callbacks ────────────────────────────────────────────────────────
  const handleCitySelect   = useCallback((city: CityLocation) => setCity(city), [setCity]);
  const handleStationSelect = useCallback((s: any) => play(s), [play]);

  // ── Font sizes proportional to cassette width ───────────────────────────────
  const nameFontSize  = Math.max(13, cw * 0.052);
  const genreFontSize = Math.max(7,  cw * 0.020);
  const iconPlaySize  = Math.max(12, cw * 0.058);

  return (
    /*
     * Root: pure black, full viewport, centred.
     * The cassette PNG floats on this with a transparent background
     * (white studio BG was removed during build-time processing).
     */
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: '#000', touchAction: 'none' }}
    >
      {/* ════════════════════════════════════════════════════════════════════
          CASSETTE WRAPPER
          Exact pixel size derived from viewport, preserving 1168:784 ratio.
          Every child is positioned with percentage values so they scale
          automatically as the wrapper resizes.
          ════════════════════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', width: cw, height: ch, flexShrink: 0 }}>

        {/* ── The cassette image ── */}
        <img
          src="/cassette-skin.png"
          alt="FM Cassette"
          draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'fill',
            pointerEvents: 'none', userSelect: 'none',
          }}
        />

        {/* ── Station name overlay ─────────────────────────────────────────
            Covers the static "98.5 FM MIX" text baked into the photo.
            Positioned over the centre of the white label area.            */}
        <div
          style={{
            position: 'absolute',
            top: '14%', left: '17%', right: '17%', height: '22%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(245,244,240,0.96)',
            pointerEvents: 'none',
          }}
        >
          {/* Station name — match the brushstroke label style */}
          <span
            style={{
              fontFamily: "'Arial Black', 'Impact', 'Helvetica Neue', sans-serif",
              fontSize: nameFontSize,
              fontWeight: 900,
              fontStyle: 'italic',
              color: '#111',
              letterSpacing: '-0.025em',
              lineHeight: 1,
              textAlign: 'center',
              maxWidth: '90%',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              transform: 'rotate(-1deg)',
              display: 'block',
            }}
          >
            {stationName}
          </span>

          {/* Genre pill */}
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: genreFontSize,
              fontWeight: 700,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: 3,
              marginTop: Math.max(2, ch * 0.012),
            }}
          >
            {genre}
          </span>
        </div>

        {/* ── ON AIR LED overlay ───────────────────────────────────────────
            The photo shows a static ON AIR indicator; we overlay the
            animated LED dot + glow directly on top of it.               */}
        <motion.div
          style={{
            position: 'absolute',
            top: '63.5%', left: '76.5%',
            width: '2%', aspectRatio: '1',
            borderRadius: '50%',
            background: state.isPlaying ? '#ff2020' : '#220000',
            boxShadow: state.isPlaying ? '0 0 8px #ff2020, 0 0 18px rgba(255,30,30,0.7)' : 'none',
            pointerEvents: 'none',
          }}
          animate={state.isPlaying ? { opacity: [1, 0.18, 1] } : { opacity: 0.25 }}
          transition={{ duration: 1.35, repeat: Infinity }}
        />

        {/* ── Play / Pause icon overlay ────────────────────────────────────
            The image always shows ⏸ — overlay the correct state icon.
            The icon size is ~70 % of the button area diameter.          */}
        <div
          style={{
            position: 'absolute',
            top: '59%', left: '43%', width: '14%', height: '18%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {state.isPlaying
            ? <Pause fill="#111" style={{ width: iconPlaySize, height: iconPlaySize, color: '#111', opacity: 0.85 }} />
            : <Play  fill="#111" style={{ width: iconPlaySize, height: iconPlaySize, color: '#111', marginLeft: '6%', opacity: 0.85 }} />
          }
        </div>

        {/* ── SAVE SESSION saved-badge overlay ─────────────────────────────
            A tiny "✓ SAVED" glow on the bookmark button when favourited.  */}
        <AnimatePresence>
          {isFav && (
            <motion.div
              key="saved-badge"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              style={{
                position: 'absolute',
                top: '59%', left: '9%', width: '21%', height: '14%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span style={{
                fontFamily: 'monospace',
                fontSize: Math.max(7, cw * 0.022),
                fontWeight: 900,
                color: cityTheme.primaryColor,
                textShadow: `0 0 10px ${cityTheme.primaryColor}`,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>
                ✓ SAVED
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: '3%', left: '20%', right: '20%',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: Math.max(8, cw * 0.022),
                color: '#ff6b6b',
                pointerEvents: 'none',
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════════════════════════════════
            INVISIBLE HOTSPOT BUTTONS
            Each covers exactly the button area visible in the cassette photo.
            Set background to 'rgba(255,0,0,0.2)' to debug alignment.
            ════════════════════════════════════════════════════════════════ */}

        {/* Skip Back |◄◄ — big button top-left of tape section */}
        <Hotspot top="40%" left="3%" width="11%" height="25%"
          onClick={() => changeStation('prev')} label="Previous station" />

        {/* Skip Forward ►► | — big button top-right of tape section */}
        <Hotspot top="40%" right="3%" width="11%" height="25%"
          onClick={() => changeStation('next')} label="Next station" />

        {/* SAVE SESSION — bookmark button */}
        <Hotspot top="59%" left="9%" width="21%" height="14%"
          onClick={() => state.currentStation && toggleFavorite(state.currentStation.id)}
          label={isFav ? 'Remove from favourites' : 'Save this station'} />

        {/* Prev |◄ — small button left of play */}
        <Hotspot top="61%" left="32%" width="8%" height="13%"
          onClick={() => changeStation('prev')} label="Previous" />

        {/* Play / Pause — large white circle */}
        <Hotspot top="59%" left="43%" width="14%" height="18%"
          onClick={togglePlayPause}
          label={state.isPlaying ? 'Pause' : 'Play'} tapScale={0.88} />

        {/* Next ►| — small button right of play */}
        <Hotspot top="61%" left="59%" width="8%" height="13%"
          onClick={() => changeStation('next')} label="Next" />

        {/* ON AIR area — tap to open station drawer */}
        <Hotspot top="59%" left="76%" width="15%" height="14%"
          onClick={() => setShowDrawer(true)} label="Browse stations" />

        {/* Volume + */}
        <Hotspot top="79%" left="3%" width="9%" height="12%"
          onClick={() => setVolume(Math.min(1, state.volume + 0.1))} label="Volume up" />

        {/* Volume − */}
        <Hotspot top="79%" right="3%" width="9%" height="12%"
          onClick={() => setVolume(Math.max(0, state.volume - 0.1))} label="Volume down" />

        {/* Label area tap → browse stations */}
        <Hotspot top="10%" left="8%" width="84%" height="30%"
          onClick={() => setShowDrawer(true)} label="Browse stations" tapScale={0.98} />

      </div>{/* end cassette wrapper */}

      {/* ════════════════════════════════════════════════════════════════════
          FLOATING CHROME — tiny elements above the cassette.
          These are fixed to the viewport corners, not relative to the image,
          so they remain accessible even on very small screens.
          ════════════════════════════════════════════════════════════════════ */}

      {/* Back button — top-left */}
      <motion.button
        aria-label="Go back"
        whileTap={{ scale: 0.85 }}
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 50,
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <ArrowLeft style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.65)' }} />
      </motion.button>

      {/* Station drawer button — top-right */}
      <motion.button
        aria-label="Browse stations"
        whileTap={{ scale: 0.85 }}
        onClick={() => setShowDrawer(true)}
        style={{
          position: 'fixed', top: 14, right: 14, zIndex: 50,
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <ListMusic style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.65)' }} />
      </motion.button>

      {/* Favorite shortcut — bottom-right (compact, barely visible) */}
      <motion.button
        aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
        whileTap={{ scale: 0.85 }}
        onClick={() => state.currentStation && toggleFavorite(state.currentStation.id)}
        style={{
          position: 'fixed', bottom: 18, right: 18, zIndex: 50,
          width: 32, height: 32, borderRadius: '50%',
          background: isFav ? `${cityTheme.primaryColor}30` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${isFav ? cityTheme.primaryColor + '60' : 'rgba(255,255,255,0.10)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Heart
          style={{
            width: 14, height: 14,
            color: isFav ? cityTheme.primaryColor : 'rgba(255,255,255,0.40)',
            fill: isFav ? cityTheme.primaryColor : 'transparent',
          }}
        />
      </motion.button>

      {/* Station Drawer */}
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

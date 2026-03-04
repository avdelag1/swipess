import { motion } from 'framer-motion';
import { SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import { CityTheme } from '@/types/radio';

interface CassetteDisplayProps {
  isPlaying: boolean;
  cityTheme: CityTheme;
  width: number;
  stationName: string;
  genre: string;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * CassetteDisplay — Realistic cassette tape UI component.
 *
 * Features:
 * - Cassette body styled after a compact cassette tape
 * - Label area colored dynamically with the active city theme
 * - Animated spinning reels when playing
 * - Play / Pause / Skip controls overlaid on the cassette body
 */
export function CassetteDisplay({
  isPlaying,
  cityTheme,
  width,
  stationName,
  genre,
  onPlayPause,
  onPrev,
  onNext,
}: CassetteDisplayProps) {
  // Standard compact cassette aspect ratio: ~96mm × 63mm ≈ 1.524:1
  const h = Math.round(width * 0.655);
  const spoolSize = Math.round(width * 0.19);
  const spoolTop = Math.round(h * 0.31);
  const leftSpoolLeft = Math.round(width * 0.21);
  const rightSpoolLeft = Math.round(width * 0.59);

  const controlBtnW = Math.round(width * 0.13);
  const controlBtnH = Math.round(controlBtnW * 0.68);
  const playBtnW = Math.round(width * 0.18);
  const playBtnH = Math.round(playBtnW * 0.68);

  return (
    <div
      className="relative select-none"
      style={{ width, height: h }}
    >
      {/* ── Cassette body ─────────────────────────────────────── */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background: 'linear-gradient(160deg, #2e2e2e 0%, #1c1c1c 50%, #111 100%)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.09)',
          border: '1.5px solid rgba(255,255,255,0.07)',
        }}
      />

      {/* ── Label ─────────────────────────────────────────────── */}
      <div
        className="absolute flex flex-col items-center justify-center overflow-hidden"
        style={{
          top: 0,
          left: '9%',
          right: '9%',
          height: h * 0.365,
          background: `linear-gradient(145deg, ${cityTheme.primaryColor}ee, ${cityTheme.secondaryColor}cc)`,
          borderRadius: '0 0 14px 14px',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 10px rgba(0,0,0,0.35)',
        }}
      >
        {/* Thin decorative lines */}
        <div className="absolute inset-x-4 top-1.5 h-px bg-white/15" />
        <div className="absolute inset-x-4 bottom-1.5 h-px bg-white/15" />

        <span
          className="text-white font-black tracking-wider leading-none drop-shadow-sm z-10"
          style={{ fontSize: Math.max(11, width * 0.072) }}
        >
          {stationName}
        </span>
        <span
          className="text-white/65 uppercase tracking-[0.22em] mt-1 z-10"
          style={{ fontSize: Math.max(8, width * 0.042) }}
        >
          {genre}
        </span>

        {/* Subtle gloss on label */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 60%)',
            borderRadius: '0 0 14px 14px',
          }}
        />
      </div>

      {/* ── Tape window ──────────────────────────────────────── */}
      <div
        className="absolute left-1/2 -translate-x-1/2 overflow-hidden"
        style={{
          top: h * 0.40,
          width: width * 0.73,
          height: h * 0.34,
          background: '#080808',
          borderRadius: 8,
          border: '1.5px solid rgba(255,255,255,0.07)',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.9)',
        }}
      >
        {/* Tape strand */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: '44%',
            height: 3,
            background: 'rgba(28,18,8,0.95)',
          }}
        />
        {/* Bottom tape hub strip */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: h * 0.055,
            background: 'linear-gradient(180deg, #111, #050505)',
          }}
        />
      </div>

      {/* ── Corner screws ─────────────────────────────────────── */}
      {[
        { top: '5%', left: '3.5%' },
        { top: '5%', right: '3.5%' },
        { bottom: '5%', left: '3.5%' },
        { bottom: '5%', right: '3.5%' },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            ...pos,
            width: Math.max(8, width * 0.042),
            height: Math.max(8, width * 0.042),
            background: 'radial-gradient(circle at 35% 35%, #444, #111)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.9)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        />
      ))}

      {/* ── Bottom tape slot ──────────────────────────────────── */}
      <div
        className="absolute"
        style={{
          bottom: 0,
          left: '28%',
          right: '28%',
          height: h * 0.09,
          background: '#000',
          borderRadius: '5px 5px 0 0',
        }}
      />

      {/* ── Left spool ────────────────────────────────────────── */}
      <Spool
        isPlaying={isPlaying}
        size={spoolSize}
        left={leftSpoolLeft}
        top={spoolTop}
        direction={1}
      />

      {/* ── Right spool ───────────────────────────────────────── */}
      <Spool
        isPlaying={isPlaying}
        size={spoolSize}
        left={rightSpoolLeft}
        top={spoolTop}
        direction={-1}
      />

      {/* ── Controls overlay ──────────────────────────────────── */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center gap-2.5"
        style={{ bottom: Math.max(6, h * 0.095) }}
      >
        {/* Skip Back */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onPrev}
          className="flex items-center justify-center rounded-md"
          style={{
            width: controlBtnW,
            height: controlBtnH,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
          aria-label="Previous station"
        >
          <SkipBack
            fill="white"
            className="text-white"
            style={{ width: Math.max(10, width * 0.058), height: Math.max(10, width * 0.058) }}
          />
        </motion.button>

        {/* Play / Pause */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onPlayPause}
          className="flex items-center justify-center rounded-md"
          style={{
            width: playBtnW,
            height: playBtnH,
            background: `linear-gradient(135deg, ${cityTheme.primaryColor}, ${cityTheme.secondaryColor})`,
            boxShadow: `0 4px 18px ${cityTheme.primaryColor}70`,
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause
              fill="white"
              className="text-white"
              style={{ width: Math.max(12, width * 0.078), height: Math.max(12, width * 0.078) }}
            />
          ) : (
            <Play
              fill="white"
              className="text-white"
              style={{ width: Math.max(12, width * 0.078), height: Math.max(12, width * 0.078), marginLeft: 2 }}
            />
          )}
        </motion.button>

        {/* Skip Forward */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onNext}
          className="flex items-center justify-center rounded-md"
          style={{
            width: controlBtnW,
            height: controlBtnH,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
          aria-label="Next station"
        >
          <SkipForward
            fill="white"
            className="text-white"
            style={{ width: Math.max(10, width * 0.058), height: Math.max(10, width * 0.058) }}
          />
        </motion.button>
      </div>
    </div>
  );
}

/* ── Spool sub-component ────────────────────────────────────── */

function Spool({
  isPlaying,
  size,
  left,
  top,
  direction,
}: {
  isPlaying: boolean;
  size: number;
  left: number;
  top: number;
  direction: 1 | -1;
}) {
  const spokeAngles = [0, 60, 120, 180, 240, 300];

  return (
    <motion.div
      className="absolute rounded-full overflow-hidden"
      style={{
        width: size,
        height: size,
        left,
        top,
        background: 'radial-gradient(circle at 40% 38%, #3c3c3c, #191919)',
        border: '2px solid rgba(255,255,255,0.12)',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
      }}
      animate={{ rotate: isPlaying ? direction * 360 : 0 }}
      transition={{
        duration: 2.4,
        repeat: Infinity,
        ease: 'linear',
        repeatType: 'loop',
      }}
    >
      {/* Spokes */}
      {spokeAngles.map((angle) => (
        <div
          key={angle}
          className="absolute bg-white/10 rounded-full"
          style={{
            width: '34%',
            height: 2,
            top: 'calc(50% - 1px)',
            left: '33%',
            transformOrigin: '0 50%',
            transform: `rotate(${angle}deg)`,
          }}
        />
      ))}

      {/* Hub cap */}
      <div
        className="absolute rounded-full"
        style={{
          width: '28%',
          height: '28%',
          top: '36%',
          left: '36%',
          background: 'radial-gradient(circle at 40% 38%, #252525, #0a0a0a)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
        }}
      />

      {/* Sheen */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)',
        }}
      />
    </motion.div>
  );
}

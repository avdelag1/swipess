/**
 * CassetteDisplay — Blue FM Cassette Skin
 *
 * Redesigned to match a 3D royal-blue cassette tape with street-art label.
 *
 * VISUAL LAYOUT (top → bottom):
 *  ┌──────────────────────────────────────────────┐
 *  │  🟧  [orange corner tab]  [orange corner tab] 🟧  │  ← top accent tabs
 *  │  ┌──────── WHITE LABEL ────────────────┐      │
 *  │  │  🔥 A    98.5 FM MIX    SIDE A 💀   │      │  ← station name (big)
 *  │  └─────────────────────────────────────┘      │
 *  │  [◄◄]  (RED KNOB)  [tape window]  (⚪KNOB)  [►►]  │  ← knobs + skip btns
 *  │  [SAVE SESSION 🔖]   [|◄]  [⬤]  [►|]   [ON AIR]  │  ← main controls
 *  │  [+]    [  ═  tape slot ═  ]                [-]  │  ← volume + slot
 *  └──────────────────────────────────────────────┘
 *
 * FUNCTION MAP:
 *   onPlayPause  → center circle button (Play / Pause)
 *   onPrev       → large ◄◄ (top-left) and small |◄ next to play
 *   onNext       → large ►► (top-right) and small ►| next to play
 *   onFavorite   → SAVE SESSION button (optional prop)
 *   onVolumeUp   → + bottom-left (optional)
 *   onVolumeDown → − bottom-right (optional)
 *
 * The city theme accent color is used for:
 *   - The large skip-forward button background (matches the purple tint in photo)
 *   - The ON AIR glow color when playing
 *   - The label decorative accent line
 */

import { motion } from 'framer-motion';
import {
  SkipBack, SkipForward, Play, Pause,
  Bookmark, BookmarkCheck, Plus, Minus,
} from 'lucide-react';
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
  /** Maps to the SAVE SESSION button */
  onFavorite?: () => void;
  isFavorite?: boolean;
  /** Maps to + volume button */
  onVolumeUp?: () => void;
  /** Maps to − volume button */
  onVolumeDown?: () => void;
}

const BTN_SPRING = { type: 'spring' as const, stiffness: 460, damping: 24, mass: 0.55 };

// ── Knob sub-component ────────────────────────────────────────────────────────
// Reproduces the ridged plastic dial look from the photo.
function Knob({
  size,
  color,        // 'red' | 'silver'
  isPlaying,
  direction,
}: {
  size: number;
  color: 'red' | 'silver';
  isPlaying: boolean;
  direction: 1 | -1;
}) {
  const baseColor  = color === 'red' ? '#9c1c1c' : '#7a7a7a';
  const highColor  = color === 'red' ? '#c0392b' : '#a8a8a8';
  const rimColor   = color === 'red' ? 'rgba(180,30,30,0.5)' : 'rgba(200,200,200,0.4)';
  const spokeColor = color === 'red' ? 'rgba(0,0,0,0.30)' : 'rgba(0,0,0,0.18)';

  return (
    <motion.div
      animate={{ rotate: isPlaying ? direction * 360 : 0 }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        flexShrink: 0,
        // Knob body — plastic gradient
        background: `radial-gradient(circle at 36% 32%, ${highColor}, ${baseColor} 55%, #1a0a0a 100%)`,
        border: `2px solid ${rimColor}`,
        boxShadow: [
          'inset 0 2px 5px rgba(255,255,255,0.15)',
          'inset 0 -3px 8px rgba(0,0,0,0.55)',
          '0 3px 10px rgba(0,0,0,0.5)',
          `0 0 0 1px rgba(0,0,0,0.35)`,
        ].join(', '),
        overflow: 'hidden',
      }}
    >
      {/* Ridged conic texture — simulates physical knurling */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `repeating-conic-gradient(
            ${spokeColor} 0deg 8deg,
            transparent 8deg 18deg
          )`,
          opacity: 0.7,
        }}
      />
      {/* Central hub */}
      <div
        style={{
          position: 'absolute',
          width: '34%',
          height: '34%',
          top: '33%',
          left: '33%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 38%, #333, #0a0a0a)`,
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.8)',
        }}
      />
      {/* Highlight sheen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 48%)',
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  );
}

// ── Tape window ───────────────────────────────────────────────────────────────
function TapeWindow({
  width: w,
  height: h,
  isPlaying,
}: {
  width: number;
  height: number;
  isPlaying: boolean;
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        background: '#060608',
        borderRadius: 6,
        border: '1.5px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.95)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Tape strand */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '44%',
          height: 3,
          background: 'linear-gradient(90deg, #1c1208, #2a1c0c, #1c1208)',
        }}
      />
      {/* Bottom hub strip */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: h * 0.28,
          background: 'linear-gradient(180deg, transparent, #080808)',
        }}
      />
      {/* Inner glass reflection */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), transparent)',
          borderRadius: '5px 5px 0 0',
        }}
      />
    </div>
  );
}

// ── Corner screw ──────────────────────────────────────────────────────────────
function Screw({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #4a4a4a, #1a1a1a)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.9)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Phillips cross */}
      <div style={{ position: 'absolute', top: '45%', left: '20%', right: '20%', height: 1.5, background: 'rgba(0,0,0,0.6)', borderRadius: 1 }} />
      <div style={{ position: 'absolute', left: '45%', top: '20%', bottom: '20%', width: 1.5, background: 'rgba(0,0,0,0.6)', borderRadius: 1 }} />
    </div>
  );
}

// ── Transport button ──────────────────────────────────────────────────────────
// Rounded-rectangle button styled after the navy cassette buttons in the photo.
function TransportBtn({
  onClick,
  width: w,
  height: h,
  bg = 'rgba(20,28,60,0.92)',
  border = '1px solid rgba(255,255,255,0.12)',
  children,
  ariaLabel,
}: {
  onClick: () => void;
  width: number;
  height: number;
  bg?: string;
  border?: string;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.85, transition: BTN_SPRING }}
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: w,
        height: h,
        borderRadius: Math.round(h * 0.28),
        background: bg,
        border,
        boxShadow: '0 2px 6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {children}
    </motion.button>
  );
}

// ── Label decorative SVG elements ─────────────────────────────────────────────
// Simple inline SVG icons that mimic the grunge sticker art on the label.
function LabelDecorLeft({ size }: { size: number }) {
  return (
    <svg width={size * 2.2} height={size} viewBox="0 0 44 20" fill="none" aria-hidden="true">
      {/* Flame */}
      <text x="0" y="15" fontSize="13" fill="#e84040">🔥</text>
      {/* Lightning */}
      <polygon points="20,2 16,10 19,10 15,18 23,8 19,8" fill="#f59e0b" />
      {/* Small trees */}
      <polygon points="30,18 33,8 36,18" fill="#166534" opacity="0.8" />
      <polygon points="37,18 40,10 43,18" fill="#166534" opacity="0.6" />
    </svg>
  );
}

function LabelDecorRight({ size, accentColor }: { size: number; accentColor: string }) {
  return (
    <svg width={size * 2.5} height={size} viewBox="0 0 50 20" fill="none" aria-hidden="true">
      {/* Skull */}
      <circle cx="38" cy="8" r="5" fill="#222" />
      <rect x="35" y="12" width="6" height="4" rx="1" fill="#222" />
      <circle cx="36.5" cy="8" r="1.3" fill="white" />
      <circle cx="39.5" cy="8" r="1.3" fill="white" />
      <rect x="36" y="13" width="1.5" height="3" fill="white" />
      <rect x="38.5" y="13" width="1.5" height="3" fill="white" />
      {/* Star */}
      <polygon points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8"
        fill={accentColor} transform="scale(0.7) translate(5, 0)" />
      {/* Boombox dots */}
      <circle cx="26" cy="10" r="2.5" fill="#e84040" />
      <circle cx="26" cy="10" r="1" fill="#f87171" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function CassetteDisplay({
  isPlaying,
  cityTheme,
  width,
  stationName,
  genre,
  onPlayPause,
  onPrev,
  onNext,
  onFavorite,
  isFavorite = false,
  onVolumeUp,
  onVolumeDown,
}: CassetteDisplayProps) {
  // Proportions derived from the reference image (1168×784 ≈ 1:0.671)
  const h = Math.round(width * 0.671);

  // Derived sizes — scale everything from width
  const s = (frac: number) => Math.round(width * frac);
  const hs = (frac: number) => Math.round(h * frac);

  const knobSize      = s(0.14);
  const tapeWinW      = s(0.34);
  const tapeWinH      = hs(0.28);
  const bigBtnW       = s(0.135);
  const bigBtnH       = hs(0.155);
  const midBtnW       = s(0.10);
  const midBtnH       = hs(0.135);
  const playBtnSize   = s(0.155);
  const smallBtnSize  = s(0.09);
  const saveBtnW      = s(0.30);
  const saveBtnH      = hs(0.125);
  const volBtnSize    = s(0.085);
  const screwSize     = Math.max(6, s(0.038));
  const iconSm        = Math.max(10, s(0.050));
  const iconMd        = Math.max(12, s(0.062));
  const iconLg        = Math.max(14, s(0.075));
  const iconPlay      = Math.max(14, s(0.082));

  // Body blue — royal cobalt
  const bodyBlue  = '#2355C7';
  const bodyDark  = '#1a3d99';
  const bodyLight = '#3468d4';

  // Accent from cityTheme (used on skip-forward + label strip)
  const accent = cityTheme.primaryColor;

  return (
    <div
      className="relative select-none"
      style={{ width, height: h }}
    >
      {/* ── Outer plastic body ──────────────────────────────────── */}
      {/* The subtle multi-stop gradient replicates the 3D plastic sheen */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(160deg,
            ${bodyLight} 0%,
            ${bodyBlue}  28%,
            ${bodyBlue}  65%,
            ${bodyDark}  100%)`,
          boxShadow: [
            '0 20px 60px rgba(0,0,0,0.65)',
            '0 8px 24px rgba(0,0,0,0.45)',
            '3px 6px 0 rgba(0,0,0,0.35)',
            'inset 0 1px 0 rgba(255,255,255,0.18)',
            'inset 0 -1px 0 rgba(0,0,0,0.30)',
          ].join(', '),
          border: '1.5px solid rgba(255,255,255,0.10)',
        }}
      />

      {/* ── Orange corner accent tabs ────────────────────────────
          In the photo the cassette has vivid orange/red plastic tabs
          at all four corners of the housing.                          */}
      {[
        { top: 0,   left: 0,   borderRadius: '12px 0 8px 0' },
        { top: 0,   right: 0,  borderRadius: '0 12px 0 8px' },
        { bottom: 0, left: 0,  borderRadius: '0 8px 12px 0' },
        { bottom: 0, right: 0, borderRadius: '8px 0 0 12px' },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            ...pos,
            width: s(0.10),
            height: hs(0.10),
            background: 'linear-gradient(135deg, #ff5722, #e64a19)',
            boxShadow: 'inset 0 1px 0 rgba(255,200,100,0.3)',
          }}
        />
      ))}

      {/* ── Corner screws ───────────────────────────────────────── */}
      {[
        { top: hs(0.06),  left:  s(0.06)  },
        { top: hs(0.06),  right: s(0.06)  },
        { bottom: hs(0.06), left: s(0.06) },
        { bottom: hs(0.06), right: s(0.06) },
      ].map((pos, i) => (
        <div key={i} className="absolute" style={{ ...pos, zIndex: 5 }}>
          <Screw size={screwSize} />
        </div>
      ))}

      {/* ── LABEL AREA ──────────────────────────────────────────── */}
      {/* White sticker-style label across the top of the cassette   */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: 0,
          left: '8%',
          right: '8%',
          height: hs(0.355),
          background: '#f8f8f6',
          borderRadius: '0 0 10px 10px',
          boxShadow: [
            'inset 0 -1px 0 rgba(0,0,0,0.08)',
            '0 2px 8px rgba(0,0,0,0.25)',
          ].join(', '),
          border: '1px solid rgba(0,0,0,0.08)',
          borderTop: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${hs(0.02)}px ${s(0.04)}px`,
          gap: 2,
          zIndex: 10,
        }}
      >
        {/* Top thin accent stripe — uses cityTheme color */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${accent}, ${cityTheme.secondaryColor ?? accent})`,
          }}
        />

        {/* Header row: left decor + "A" label + right decor */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `0 ${s(0.02)}px`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LabelDecorLeft size={Math.max(10, s(0.045))} />
            <span style={{
              fontSize: Math.max(8, s(0.038)),
              fontWeight: 900,
              color: '#222',
              letterSpacing: 1,
              fontFamily: 'monospace',
            }}>
              A
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{
              fontSize: Math.max(7, s(0.032)),
              fontWeight: 800,
              color: '#555',
              letterSpacing: 2,
              fontFamily: 'monospace',
            }}>
              SIDE A
            </span>
            <LabelDecorRight size={Math.max(10, s(0.045))} accentColor={accent} />
          </div>
        </div>

        {/* Station name — big bold brushstroke-style type */}
        <div style={{ textAlign: 'center', lineHeight: 1 }}>
          <span
            style={{
              fontSize: Math.max(14, s(0.092)),
              fontWeight: 900,
              fontStyle: 'italic',
              color: '#111',
              fontFamily: "'Arial Black', 'Impact', 'Helvetica Neue', sans-serif",
              letterSpacing: '-0.03em',
              display: 'inline-block',
              transform: 'rotate(-1.5deg)',
              textShadow: '1px 1px 0 rgba(0,0,0,0.08)',
            }}
          >
            {stationName}
          </span>
        </div>

        {/* Genre / frequency row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: Math.max(7, s(0.030)),
            fontWeight: 800,
            color: '#888',
            letterSpacing: 3,
            textTransform: 'uppercase',
            fontFamily: 'monospace',
          }}>
            {genre}
          </span>
          <span style={{
            fontSize: Math.max(7, s(0.028)),
            fontWeight: 700,
            color: '#aaa',
            letterSpacing: 1,
            fontFamily: 'monospace',
          }}>
            LOUD
          </span>
        </div>
      </div>

      {/* ── TAPE AREA: Knobs + window + big skip buttons ─────────── */}
      <div
        className="absolute"
        style={{
          top: hs(0.37),
          left: s(0.04),
          right: s(0.04),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: s(0.022),
          zIndex: 10,
        }}
      >
        {/* Big skip-back button (◄◄|) */}
        <TransportBtn
          onClick={onPrev}
          width={bigBtnW}
          height={bigBtnH}
          bg="rgba(18,26,62,0.95)"
          ariaLabel="Previous station"
        >
          <SkipBack fill="white" className="text-white" style={{ width: iconMd, height: iconMd }} />
        </TransportBtn>

        {/* Left knob (red) */}
        <Knob size={knobSize} color="red" isPlaying={isPlaying} direction={1} />

        {/* Tape window */}
        <TapeWindow width={tapeWinW} height={tapeWinH} isPlaying={isPlaying} />

        {/* Right knob (silver) */}
        <Knob size={knobSize} color="silver" isPlaying={isPlaying} direction={-1} />

        {/* Big skip-forward button (|►►) — uses accent colour (purple tint in photo) */}
        <TransportBtn
          onClick={onNext}
          width={bigBtnW}
          height={bigBtnH}
          bg={`linear-gradient(135deg, ${accent}cc, ${cityTheme.secondaryColor ?? accent}aa)`}
          border={`1px solid ${accent}50`}
          ariaLabel="Next station"
        >
          <SkipForward fill="white" className="text-white" style={{ width: iconMd, height: iconMd }} />
        </TransportBtn>
      </div>

      {/* Small "98.5 FM" style freq label — right of tape window area */}
      {/* (shown in the photo between the right knob and the ►► button) */}

      {/* ── MAIN CONTROLS ROW ───────────────────────────────────── */}
      {/* SAVE SESSION | |◄ | ⬤ play | ►| | ON AIR              */}
      <div
        className="absolute"
        style={{
          top: hs(0.60),
          left: s(0.04),
          right: s(0.04),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: s(0.015),
          zIndex: 10,
        }}
      >
        {/* SAVE SESSION — bookmark/favorite button */}
        <motion.button
          whileTap={{ scale: 0.88, transition: BTN_SPRING }}
          onClick={onFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Save this station'}
          style={{
            width: saveBtnW,
            height: saveBtnH,
            borderRadius: Math.round(saveBtnH * 0.35),
            background: isFavorite
              ? `linear-gradient(135deg, ${accent}cc, ${cityTheme.secondaryColor ?? accent}99)`
              : 'rgba(18,26,62,0.88)',
            border: isFavorite ? `1px solid ${accent}60` : '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Math.max(3, s(0.02)),
            cursor: onFavorite ? 'pointer' : 'default',
            opacity: onFavorite ? 1 : 0.5,
          }}
        >
          {isFavorite
            ? <BookmarkCheck style={{ width: iconSm, height: iconSm, color: 'white' }} />
            : <Bookmark style={{ width: iconSm, height: iconSm, color: 'rgba(255,255,255,0.75)' }} />
          }
          <span style={{
            fontSize: Math.max(7, s(0.030)),
            fontWeight: 800,
            color: isFavorite ? 'white' : 'rgba(255,255,255,0.70)',
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
          }}>
            {isFavorite ? 'Saved' : 'Save Session'}
          </span>
        </motion.button>

        {/* Small prev (|◄) */}
        <motion.button
          whileTap={{ scale: 0.82, transition: BTN_SPRING }}
          onClick={onPrev}
          aria-label="Previous"
          style={{
            width: smallBtnSize,
            height: smallBtnSize,
            borderRadius: '50%',
            background: 'rgba(18,26,62,0.88)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <SkipBack fill="white" style={{ width: iconSm * 0.85, height: iconSm * 0.85, color: 'white' }} />
        </motion.button>

        {/* CENTER PLAY / PAUSE — large white circle (the hero button) */}
        <motion.button
          whileTap={{ scale: 0.88, transition: BTN_SPRING }}
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          style={{
            width: playBtnSize,
            height: playBtnSize,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 34%, #ffffff, #d4d4d4)',
            boxShadow: [
              '0 4px 14px rgba(0,0,0,0.50)',
              'inset 0 1px 0 rgba(255,255,255,0.9)',
              'inset 0 -2px 4px rgba(0,0,0,0.12)',
              isPlaying ? `0 0 16px rgba(255,255,255,0.20)` : '',
            ].filter(Boolean).join(', '),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          {isPlaying
            ? <Pause fill="#111" style={{ width: iconPlay, height: iconPlay, color: '#111' }} />
            : <Play  fill="#111" style={{ width: iconPlay, height: iconPlay, color: '#111', marginLeft: 2 }} />
          }
        </motion.button>

        {/* Small next (►|) */}
        <motion.button
          whileTap={{ scale: 0.82, transition: BTN_SPRING }}
          onClick={onNext}
          aria-label="Next"
          style={{
            width: smallBtnSize,
            height: smallBtnSize,
            borderRadius: '50%',
            background: 'rgba(18,26,62,0.88)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <SkipForward fill="white" style={{ width: iconSm * 0.85, height: iconSm * 0.85, color: 'white' }} />
        </motion.button>

        {/* ON AIR — LED indicator, glows red when playing */}
        <div
          style={{
            padding: `${Math.max(3, hs(0.025))}px ${Math.max(6, s(0.04))}px`,
            borderRadius: Math.max(4, hs(0.05)),
            background: '#08080e',
            border: `1px solid ${isPlaying ? 'rgba(255,30,30,0.40)' : 'rgba(255,255,255,0.06)'}`,
            boxShadow: isPlaying
              ? '0 0 12px rgba(255,30,30,0.35), inset 0 0 6px rgba(0,0,0,0.8)'
              : 'inset 0 0 4px rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: Math.max(3, s(0.018)),
            flexShrink: 0,
          }}
        >
          {/* LED dot */}
          <motion.div
            animate={isPlaying ? { opacity: [1, 0.25, 1] } : { opacity: 0.15 }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{
              width: Math.max(5, s(0.026)),
              height: Math.max(5, s(0.026)),
              borderRadius: '50%',
              background: '#ff2020',
              boxShadow: isPlaying ? '0 0 6px #ff2020, 0 0 14px rgba(255,30,30,0.7)' : 'none',
            }}
          />
          <span style={{
            fontSize: Math.max(7, s(0.030)),
            fontWeight: 900,
            color: isPlaying ? '#ff4444' : '#3a1515',
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontFamily: 'monospace',
          }}>
            {isPlaying ? 'ON AIR' : 'OFF'}
          </span>
        </div>
      </div>

      {/* ── BOTTOM ROW: + tape slot − ────────────────────────────── */}
      <div
        className="absolute"
        style={{
          bottom: hs(0.065),
          left: s(0.045),
          right: s(0.045),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        {/* Volume + */}
        <motion.button
          whileTap={{ scale: 0.84, transition: BTN_SPRING }}
          onClick={onVolumeUp}
          aria-label="Volume up"
          style={{
            width: volBtnSize,
            height: volBtnSize,
            borderRadius: Math.round(volBtnSize * 0.28),
            background: 'rgba(18,26,62,0.88)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: onVolumeUp ? 'pointer' : 'default',
            opacity: onVolumeUp ? 1 : 0.45,
          }}
        >
          <Plus style={{ width: iconSm, height: iconSm, color: 'rgba(255,255,255,0.85)' }} />
        </motion.button>

        {/* Tape slot — the little holes in the cassette bottom edge */}
        <div style={{ display: 'flex', gap: Math.max(3, s(0.018)), alignItems: 'center' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              width: Math.max(4, s(0.025)),
              height: Math.max(7, hs(0.055)),
              background: '#030303',
              borderRadius: 2,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.9)',
              border: '0.5px solid rgba(255,255,255,0.04)',
            }} />
          ))}
        </div>

        {/* Volume - */}
        <motion.button
          whileTap={{ scale: 0.84, transition: BTN_SPRING }}
          onClick={onVolumeDown}
          aria-label="Volume down"
          style={{
            width: volBtnSize,
            height: volBtnSize,
            borderRadius: Math.round(volBtnSize * 0.28),
            background: 'rgba(18,26,62,0.88)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: onVolumeDown ? 'pointer' : 'default',
            opacity: onVolumeDown ? 1 : 0.45,
          }}
        >
          <Minus style={{ width: iconSm, height: iconSm, color: 'rgba(255,255,255,0.85)' }} />
        </motion.button>
      </div>

      {/* ── Plastic body edge highlights ─────────────────────────
          Top bright edge + bottom dark edge = 3D cassette depth feel */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.15) 100%)',
        }}
      />
    </div>
  );
}

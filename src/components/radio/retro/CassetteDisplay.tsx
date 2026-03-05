import { motion, AnimatePresence } from 'framer-motion';
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
 * CassetteDisplay — HD Photorealistic cassette tape watermark.
 *
 * Uses a high-definition retro cassette photograph as the visual centerpiece.
 * The image is rendered as a semi-transparent watermark with controls overlaid.
 * Station name and genre are displayed as dynamic text on top.
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
  // Cassette aspect ratio (~1:0.655)
  const h = Math.round(width * 0.655);

  const controlBtnW = Math.round(width * 0.13);
  const controlBtnH = Math.round(controlBtnW * 0.68);
  const playBtnW = Math.round(width * 0.18);
  const playBtnH = Math.round(playBtnW * 0.68);

  return (
    <div
      className="relative select-none"
      style={{ width, height: h }}
    >
      {/* ── HD Cassette Image (Watermark style) ──────────────── */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: isPlaying ? [1, 1.008, 1] : 1,
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <img
          src="/images/retro-cassette-hd.png"
          alt="Retro Cassette Tape"
          className="w-full h-full object-contain"
          style={{
            opacity: 0.22,
            filter: `
              drop-shadow(0 0 30px ${cityTheme.primaryColor}40)
              drop-shadow(0 0 60px ${cityTheme.primaryColor}20)
            `,
            mixBlendMode: 'screen',
          }}
          draggable={false}
        />
      </motion.div>

      {/* ── Second cassette layer for depth (slightly brighter) ── */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{
          scale: isPlaying ? [1.005, 1, 1.005] : 1,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <img
          src="/images/retro-cassette-hd.png"
          alt=""
          className="w-full h-full object-contain"
          style={{
            opacity: 0.12,
            filter: `
              drop-shadow(0 0 20px ${cityTheme.secondaryColor}30)
              blur(1px)
            `,
            mixBlendMode: 'screen',
          }}
          draggable={false}
        />
      </motion.div>

      {/* ── Ambient glow ring ──────────────────────────────────── */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `
                  radial-gradient(ellipse at 50% 40%, ${cityTheme.primaryColor}15 0%, transparent 65%),
                  radial-gradient(ellipse at 50% 60%, ${cityTheme.secondaryColor}10 0%, transparent 55%)
                `,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Station label overlay ─────────────────────────────── */}
      <div
        className="absolute flex flex-col items-center justify-center z-20"
        style={{
          top: h * 0.12,
          left: '15%',
          right: '15%',
          height: h * 0.32,
        }}
      >
        {/* Station name - handwritten watermark style */}
        <motion.span
          key={stationName}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="text-white/80 font-black tracking-wider leading-none drop-shadow-lg text-center"
          style={{
            fontSize: Math.max(14, width * 0.078),
            textShadow: `
              0 0 20px ${cityTheme.primaryColor}60,
              0 0 40px ${cityTheme.primaryColor}30,
              0 2px 4px rgba(0,0,0,0.8)
            `,
            fontFamily: "'Permanent Marker', cursive",
          }}
        >
          {stationName}
        </motion.span>

        {/* Genre tag */}
        <motion.span
          key={genre}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="uppercase tracking-[0.3em] mt-2"
          style={{
            fontSize: Math.max(8, width * 0.038),
            color: cityTheme.primaryColor,
            opacity: 0.7,
            textShadow: `0 0 12px ${cityTheme.primaryColor}50`,
          }}
        >
          {genre}
        </motion.span>
      </div>

      {/* ── Spinning reel indicators ──────────────────────────── */}
      <AnimatePresence>
        {isPlaying && (
          <>
            <motion.div
              className="absolute rounded-full border border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 0.4 },
              }}
              style={{
                width: width * 0.14,
                height: width * 0.14,
                top: h * 0.42,
                left: width * 0.23,
                background: `radial-gradient(circle, ${cityTheme.primaryColor}15, transparent 70%)`,
                boxShadow: `inset 0 0 12px ${cityTheme.primaryColor}20`,
              }}
            >
              {/* Reel spokes */}
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <div
                  key={angle}
                  className="absolute bg-white/8 rounded-full"
                  style={{
                    width: '34%',
                    height: 1.5,
                    top: 'calc(50% - 0.75px)',
                    left: '33%',
                    transformOrigin: '0 50%',
                    transform: `rotate(${angle}deg)`,
                  }}
                />
              ))}
              <div
                className="absolute rounded-full"
                style={{
                  width: '24%',
                  height: '24%',
                  top: '38%',
                  left: '38%',
                  background: `radial-gradient(circle, ${cityTheme.primaryColor}30, transparent)`,
                }}
              />
            </motion.div>

            <motion.div
              className="absolute rounded-full border border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: -360 }}
              exit={{ opacity: 0 }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 0.4 },
              }}
              style={{
                width: width * 0.14,
                height: width * 0.14,
                top: h * 0.42,
                right: width * 0.23,
                background: `radial-gradient(circle, ${cityTheme.secondaryColor}15, transparent 70%)`,
                boxShadow: `inset 0 0 12px ${cityTheme.secondaryColor}20`,
              }}
            >
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <div
                  key={angle}
                  className="absolute bg-white/8 rounded-full"
                  style={{
                    width: '34%',
                    height: 1.5,
                    top: 'calc(50% - 0.75px)',
                    left: '33%',
                    transformOrigin: '0 50%',
                    transform: `rotate(${angle}deg)`,
                  }}
                />
              ))}
              <div
                className="absolute rounded-full"
                style={{
                  width: '24%',
                  height: '24%',
                  top: '38%',
                  left: '38%',
                  background: `radial-gradient(circle, ${cityTheme.secondaryColor}30, transparent)`,
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Controls overlay ──────────────────────────────────── */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center gap-3 z-30"
        style={{ bottom: Math.max(8, h * 0.1) }}
      >
        {/* Skip Back */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.08 }}
          onClick={onPrev}
          className="flex items-center justify-center rounded-xl backdrop-blur-xl"
          style={{
            width: controlBtnW,
            height: controlBtnH,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
          aria-label="Previous station"
        >
          <SkipBack
            fill="white"
            className="text-white/80"
            style={{ width: Math.max(10, width * 0.055), height: Math.max(10, width * 0.055) }}
          />
        </motion.button>

        {/* Play / Pause */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.06 }}
          onClick={onPlayPause}
          className="flex items-center justify-center rounded-xl backdrop-blur-xl"
          style={{
            width: playBtnW,
            height: playBtnH,
            background: `linear-gradient(135deg, ${cityTheme.primaryColor}cc, ${cityTheme.secondaryColor}aa)`,
            boxShadow: `0 6px 24px ${cityTheme.primaryColor}50, inset 0 1px 0 rgba(255,255,255,0.2)`,
            border: `1px solid ${cityTheme.primaryColor}40`,
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause
              fill="white"
              className="text-white"
              style={{ width: Math.max(12, width * 0.075), height: Math.max(12, width * 0.075) }}
            />
          ) : (
            <Play
              fill="white"
              className="text-white"
              style={{ width: Math.max(12, width * 0.075), height: Math.max(12, width * 0.075), marginLeft: 2 }}
            />
          )}
        </motion.button>

        {/* Skip Forward */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.08 }}
          onClick={onNext}
          className="flex items-center justify-center rounded-xl backdrop-blur-xl"
          style={{
            width: controlBtnW,
            height: controlBtnH,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
          aria-label="Next station"
        >
          <SkipForward
            fill="white"
            className="text-white/80"
            style={{ width: Math.max(10, width * 0.055), height: Math.max(10, width * 0.055) }}
          />
        </motion.button>
      </div>

      {/* ── Tape progress line ─────────────────────────────────── */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            className="absolute left-[15%] right-[15%] z-20"
            style={{ top: h * 0.52 }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative h-[1.5px] rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${cityTheme.primaryColor}, ${cityTheme.secondaryColor})`,
                  boxShadow: `0 0 8px ${cityTheme.primaryColor}60`,
                }}
                animate={{ width: ['0%', '100%'] }}
                transition={{
                  duration: 30,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

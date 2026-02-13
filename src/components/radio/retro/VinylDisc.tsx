import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { CityTheme } from '@/types/radio';

interface VinylDiscProps {
  isPlaying: boolean;
  stationName: string;
  genre: string;
  cityTheme: CityTheme;
  /** Size in pixels (width & height). Defaults to 280. */
  size?: number;
}

/**
 * Realistic vinyl record disc with:
 * - Smooth continuous rotation when playing
 * - Realistic grooves rendered via radial gradients
 * - Album art / station label in the center
 * - Tonearm that swings on/off the record
 * - Sheen highlight for depth
 */
export function VinylDisc({
  isPlaying,
  stationName,
  genre,
  cityTheme,
  size = 280,
}: VinylDiscProps) {
  const controls = useAnimationControls();
  const rotationRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Use manual rotation via requestAnimationFrame for truly smooth 60fps spin
  // that can pause/resume without resetting
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();

      const spin = (now: number) => {
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;
        // ~5 RPM visual speed = 30 deg/sec
        rotationRef.current = (rotationRef.current + (delta / 1000) * 30) % 360;
        controls.set({ rotate: rotationRef.current });
        rafRef.current = requestAnimationFrame(spin);
      };

      rafRef.current = requestAnimationFrame(spin);
    } else {
      cancelAnimationFrame(rafRef.current);
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, controls]);

  const discSize = size;
  const grooveCount = 8;
  const labelSize = size * 0.32;
  const holeSize = size * 0.04;

  return (
    <div className="relative" style={{ width: discSize, height: discSize }}>
      {/* Outer disc shadow for depth */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: isPlaying
            ? '0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.2), inset 0 0 30px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.2)',
          transition: 'box-shadow 0.6s ease',
        }}
      />

      {/* Spinning disc */}
      <motion.div
        animate={controls}
        className="absolute inset-0 rounded-full"
        style={{
          background: `
            radial-gradient(circle at 50% 50%,
              transparent ${(labelSize / discSize) * 50 - 1}%,
              #1a1a1a ${(labelSize / discSize) * 50}%,
              #111 ${(labelSize / discSize) * 50 + 1}%,
              #1a1a1a 100%
            )
          `,
          willChange: 'transform',
        }}
      >
        {/* Vinyl grooves - concentric rings */}
        {Array.from({ length: grooveCount }).map((_, i) => {
          const innerPct = ((labelSize / 2 + ((discSize / 2 - labelSize / 2) * (i + 1)) / (grooveCount + 1)) / (discSize / 2)) * 100;
          return (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                inset: `${50 - innerPct / 2}%`,
                width: `${innerPct}%`,
                height: `${innerPct}%`,
                left: `${50 - innerPct / 2}%`,
                top: `${50 - innerPct / 2}%`,
                border: '0.5px solid',
                borderColor: i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
              }}
            />
          );
        })}

        {/* Micro-groove texture via repeating radial gradient */}
        <div
          className="absolute inset-0 rounded-full opacity-30 pointer-events-none"
          style={{
            background: `repeating-radial-gradient(
              circle at center,
              transparent 0px,
              transparent 2px,
              rgba(255,255,255,0.015) 2.5px,
              transparent 3px
            )`,
          }}
        />

        {/* Sheen highlight - light reflection */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.03) 100%)',
          }}
        />

        {/* Center label */}
        <div
          className="absolute rounded-full flex flex-col items-center justify-center overflow-hidden"
          style={{
            width: labelSize,
            height: labelSize,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: `linear-gradient(135deg, ${cityTheme.primaryColor}, ${cityTheme.secondaryColor})`,
            boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)',
          }}
        >
          {/* Label ring decoration */}
          <div
            className="absolute rounded-full border border-white/20"
            style={{
              width: labelSize - 8,
              height: labelSize - 8,
            }}
          />

          {/* Station text on label */}
          <span
            className="text-white font-bold text-center leading-tight z-10 px-2"
            style={{ fontSize: Math.max(9, labelSize * 0.13) }}
          >
            {stationName}
          </span>
          <span
            className="text-white/70 uppercase tracking-wider z-10"
            style={{ fontSize: Math.max(7, labelSize * 0.09) }}
          >
            {genre}
          </span>

          {/* Center hole */}
          <div
            className="absolute rounded-full bg-gray-900"
            style={{
              width: holeSize,
              height: holeSize,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
            }}
          />
        </div>
      </motion.div>

      {/* Tonearm */}
      <motion.div
        className="absolute z-10"
        style={{
          top: -8,
          right: -4,
          transformOrigin: '85% 15%',
        }}
        animate={{
          rotate: isPlaying ? 22 : 0,
        }}
        transition={{
          duration: 0.8,
          ease: [0.34, 1.56, 0.64, 1], // spring-like
        }}
      >
        {/* Pivot */}
        <div
          className="absolute rounded-full bg-gradient-to-b from-gray-400 to-gray-600"
          style={{
            width: 16,
            height: 16,
            top: 0,
            right: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          <div className="absolute inset-1 rounded-full bg-gray-700" />
        </div>
        {/* Arm */}
        <div
          className="absolute bg-gradient-to-l from-gray-400 via-gray-300 to-gray-500 rounded-full"
          style={{
            width: size * 0.35,
            height: 3,
            top: 6,
            right: 8,
            transformOrigin: 'right center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
        {/* Cartridge head */}
        <div
          className="absolute bg-gradient-to-b from-gray-500 to-gray-700 rounded-sm"
          style={{
            width: 8,
            height: 12,
            top: 1,
            right: size * 0.35 + 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
        {/* Stylus */}
        <div
          className="absolute bg-white rounded-full"
          style={{
            width: 2,
            height: 4,
            top: 11,
            right: size * 0.35 + 5,
          }}
        />
      </motion.div>
    </div>
  );
}

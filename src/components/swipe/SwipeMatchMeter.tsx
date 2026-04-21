/**
 * SWIPE MATCH METER — Glassmorphic Radial Match Indicator
 *
 * A premium floating badge that shows the calculated match percentage
 * directly on the swipe card. Uses a conic-gradient ring that fills
 * based on percentage, with color transitions from amber → emerald → cyan.
 *
 * Renders as a compact glass pill in the card's header area.
 * Only shown when matchPercentage > 0 (i.e., genuine filter data exists).
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles, Zap, Star } from 'lucide-react';

interface SwipeMatchMeterProps {
  percentage: number;
  reasons?: string[];
  compact?: boolean;
}

function SwipeMatchMeterComponent({ percentage, reasons, compact = false }: SwipeMatchMeterProps) {
  const { color, bgGlow, icon, label } = useMemo(() => {
    if (percentage >= 90) return {
      color: '#34d399', // emerald-400
      bgGlow: 'rgba(52, 211, 153, 0.25)',
      icon: <Star className="w-3 h-3 fill-current" />,
      label: 'Perfect',
    };
    if (percentage >= 75) return {
      color: '#22d3ee', // cyan-400
      bgGlow: 'rgba(34, 211, 238, 0.20)',
      icon: <Flame className="w-3 h-3 fill-current" />,
      label: 'Great',
    };
    if (percentage >= 55) return {
      color: '#60a5fa', // blue-400
      bgGlow: 'rgba(96, 165, 250, 0.18)',
      icon: <Zap className="w-3 h-3" />,
      label: 'Good',
    };
    return {
      color: '#fbbf24', // amber-400
      bgGlow: 'rgba(251, 191, 36, 0.15)',
      icon: <Sparkles className="w-3 h-3" />,
      label: 'Match',
    };
  }, [percentage]);

  // Conic gradient for the ring — computed unconditionally before any early return
  const ringStyle = useMemo(() => ({
    background: `conic-gradient(${color} ${percentage * 3.6}deg, rgba(255,255,255,0.08) ${percentage * 3.6}deg)`,
  }), [percentage, color]);

  // Don't render for 0% or undefined (after all hooks)
  if (!percentage || percentage <= 0) return null;

  if (compact) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.50)',
          border: `1px solid ${color}40`,
          boxShadow: `0 0 12px ${bgGlow}`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <span style={{ color }}>{icon}</span>
        <span className="text-[11px] font-black text-white tabular-nums">{percentage}%</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.4 }}
      className="flex items-center gap-2.5"
      title={reasons?.join(' · ') || ''}
    >
      {/* Radial ring */}
      <div
        className="relative w-10 h-10 rounded-full flex items-center justify-center"
        style={ringStyle}
      >
        <div
          className="absolute inset-[2px] rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.70)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <span className="text-[10px] font-black text-white tabular-nums">{percentage}</span>
        </div>
      </div>

      {/* Label pill */}
      <div
        className="flex items-center gap-1 px-2.5 py-1 rounded-full"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          border: `1px solid ${color}30`,
          boxShadow: `0 0 16px ${bgGlow}`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
          {label} Match
        </span>
      </div>
    </motion.div>
  );
}

export const SwipeMatchMeter = memo(SwipeMatchMeterComponent);


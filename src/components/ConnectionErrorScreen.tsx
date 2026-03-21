/**
 * FLAGSHIP RECOVERY SCREEN
 *
 * Premium error/offline state that keeps the UI alive and beautiful
 * while the connection is re-established. Includes:
 *   - Animated signal wave pulses
 *   - Connection state progress ring
 *   - Spring-physics retry button
 *   - Subtle particle background to maintain visual depth
 */

import { WifiOff, RefreshCw, Loader2, Wifi, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectionStatus } from '@/hooks/useConnectionHealth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ConnectionErrorScreenProps {
  status: ConnectionStatus;
  retryCount: number;
  onRetry: () => void;
}

const PULSE_RINGS = [0, 1, 2];

export function ConnectionErrorScreen({ status, retryCount, onRetry }: ConnectionErrorScreenProps) {
  const isChecking = status === 'checking';
  const isDegraded = status === 'degraded';
  const isDisconnected = status === 'disconnected';
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const statusConfig = isChecking
    ? { icon: Wifi, color: '#60a5fa', label: 'Connecting…', sub: 'Establishing a secure tunnel to Swipess servers.' }
    : isDegraded
    ? { icon: Zap, color: '#fbbf24', label: 'Reconnecting…', sub: 'Signal is weak. Attempting to restore full connection.' }
    : { icon: WifiOff, color: '#f87171', label: "Can't Connect", sub: 'Unable to reach the server. Check your connection.' };

  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={cn(
        "min-h-screen min-h-dvh flex flex-col items-center justify-center px-6 text-center relative overflow-hidden",
        isLight ? "bg-slate-50" : "bg-black"
      )}
    >
      {/* Background ambient particles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4 + Math.random() * 6,
              height: 4 + Math.random() * 6,
              left: `${15 + Math.random() * 70}%`,
              top: `${20 + Math.random() * 60}%`,
              backgroundColor: `${statusConfig.color}20`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex flex-col items-center gap-8 max-w-xs w-full relative z-10"
      >
        {/* Animated Signal Hub */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Pulse rings */}
          {(isChecking || isDegraded) && PULSE_RINGS.map((i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: `${statusConfig.color}30` }}
              animate={{
                scale: [1, 2.2],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Main icon circle */}
          <motion.div
            animate={isDisconnected
              ? { scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity } }
              : { rotate: 360, transition: { duration: 8, repeat: Infinity, ease: 'linear' } }
            }
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center border",
              isLight ? "bg-white shadow-xl" : "bg-zinc-900/80"
            )}
            style={{
              borderColor: `${statusConfig.color}30`,
              boxShadow: `0 0 40px ${statusConfig.color}15, 0 0 80px ${statusConfig.color}08`,
            }}
          >
            <motion.div
              animate={isDisconnected ? {} : { rotate: -360 }}
              transition={isDisconnected ? {} : { duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              {isChecking || isDegraded ? (
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: statusConfig.color }} />
              ) : (
                <StatusIcon className="w-10 h-10" style={{ color: statusConfig.color }} />
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Status Text */}
        <div className="space-y-2">
          <h1 className={cn("text-2xl font-black italic uppercase tracking-tighter", isLight ? "text-slate-900" : "text-white")}>
            {statusConfig.label}
          </h1>
          <p className={cn("text-sm font-medium leading-relaxed", isLight ? "text-slate-500" : "text-white/50")}>
            {statusConfig.sub}
          </p>
        </div>

        {/* Retry progress */}
        <AnimatePresence>
          {retryCount > 0 && !isChecking && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex gap-1">
                {[...Array(Math.min(retryCount, 5))].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: statusConfig.color }}
                  />
                ))}
              </div>
              <span className={cn("text-[10px] font-black uppercase tracking-widest", isLight ? "text-slate-400" : "text-white/30")}>
                {retryCount} attempt{retryCount !== 1 ? 's' : ''}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Retry Button — premium spring animation */}
        {isDisconnected && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className={cn(
              "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2.5 shadow-2xl transition-all",
              isLight
                ? "bg-slate-900 text-white shadow-black/10"
                : "bg-white text-black shadow-white/5"
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </motion.button>
        )}

        {/* Branding watermark */}
        <div className={cn("flex items-center gap-2 pt-4", isLight ? "opacity-20" : "opacity-10")}>
          <img src="/icons/fire-s-logo.png" alt="" className="w-5 h-5" draggable={false} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Swipess</span>
        </div>
      </motion.div>
    </div>
  );
}

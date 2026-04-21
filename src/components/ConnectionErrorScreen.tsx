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
import { motion } from 'framer-motion';
import { ConnectionStatus } from '@/hooks/useConnectionHealth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ConnectionErrorScreenProps {
  status: ConnectionStatus;
  retryCount: number;
  onRetry: () => void;
}

const _PULSE_RINGS = [0, 1, 2];

export function ConnectionErrorScreen({ status, retryCount, onRetry }: ConnectionErrorScreenProps) {
  const isChecking = status === 'checking';
  const isDegraded = status === 'degraded';
  const isDisconnected = status === 'disconnected';
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const statusConfig = isChecking
    ? { icon: Wifi, color: '#60a5fa', label: 'Connecting…', sub: 'Establishing a secure tunnel to NEXUS DISCOVERY servers.' }
    : isDegraded
    ? { icon: Zap, color: '#fbbf24', label: 'Reconnecting…', sub: 'Signal is weak. Attempting to restore full connection.' }
    : { icon: WifiOff, color: '#f87171', label: "Can't Connect", sub: 'Unable to reach the server. Check your connection.' };

  const _StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex flex-col items-center gap-8 max-w-xs w-full relative z-10"
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center">
          {isChecking || isDegraded ? (
            <Loader2 className="w-9 h-9 text-muted-foreground animate-spin" />
          ) : (
            <WifiOff className="w-9 h-9 text-muted-foreground" />
          )}
        </div>

        {/* Status Text */}
        <div className="space-y-2">
          <h1 className="text-foreground text-xl font-semibold">
            {isChecking ? 'Connecting…' : isDegraded ? 'Reconnecting…' : 'Can\'t connect'}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {isChecking || isDegraded
              ? 'Establishing connection to the server. This usually takes a few seconds.'
              : 'Unable to reach the server. Please check your internet connection and try again.'}
          </p>
        </div>

        {/* Retry count hint */}
        {retryCount > 0 && !isChecking && (
          <p className="text-muted-foreground/60 text-xs">
            Attempted {retryCount} time{retryCount !== 1 ? 's' : ''}
          </p>
        )}

        {/* Retry Button — premium spring animation */}
        {isDisconnected && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className="w-full h-12 bg-foreground text-background rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </motion.button>
        )}

        {/* Branding watermark */}
        <div className={cn("flex items-center gap-2 pt-4", isLight ? "opacity-20" : "opacity-10")}>
          <img src="/icons/nexus-logo.png" alt="" className="w-5 h-5" draggable={false} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">NEXUS DISCOVERY</span>
        </div>
      </motion.div>
    </div>
  );
}



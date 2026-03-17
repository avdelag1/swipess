/**
 * ConnectionErrorScreen
 *
 * Shown when the Supabase backend is unreachable (project paused, network down, etc.).
 * Replaces the blank/frozen screen that users were seeing before.
 */

import { WifiOff, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ConnectionStatus } from '@/hooks/useConnectionHealth';

interface ConnectionErrorScreenProps {
  status: ConnectionStatus;
  retryCount: number;
  onRetry: () => void;
}

export function ConnectionErrorScreen({ status, retryCount, onRetry }: ConnectionErrorScreenProps) {
  const isChecking = status === 'checking';
  const isDegraded = status === 'degraded';

  return (
    <div
      className="min-h-screen min-h-dvh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#050505' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col items-center gap-6 max-w-xs w-full"
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          {isChecking || isDegraded ? (
            <Loader2 className="w-9 h-9 text-white/60 animate-spin" />
          ) : (
            <WifiOff className="w-9 h-9 text-white/50" />
          )}
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-white text-xl font-semibold">
            {isChecking ? 'Connecting…' : isDegraded ? 'Reconnecting…' : 'Can\'t connect'}
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            {isChecking || isDegraded
              ? 'Establishing connection to the server. This usually takes a few seconds.'
              : 'Unable to reach the server. Please check your internet connection and try again.'}
          </p>
        </div>

        {/* Retry count hint */}
        {retryCount > 0 && !isChecking && (
          <p className="text-white/30 text-xs">
            Attempted {retryCount} time{retryCount !== 1 ? 's' : ''}
          </p>
        )}

        {/* Retry button — only shown when fully disconnected */}
        {status === 'disconnected' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={onRetry}
            className="w-full h-12 bg-white text-black rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

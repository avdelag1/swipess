/**
 * Connection Health Hook
 *
 * Proactively checks if Supabase is reachable when the app loads.
 * Detects paused projects, network outages, or unreachable backends early
 * so the user sees a clear error instead of a frozen/blank screen.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/utils/prodLogger';

export type ConnectionStatus = 'checking' | 'connected' | 'degraded' | 'disconnected';

interface ConnectionHealth {
  status: ConnectionStatus;
  lastChecked: Date | null;
  retryCount: number;
  retry: () => void;
}

const CHECK_TIMEOUT_MS = 5000; // Reduced to 5s for faster 'Speed of Light' detection
const MAX_RETRIES = 3;
const SUPABASE_HEALTH_URL = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

function isErrorWithMessage(err: unknown): err is { message: string; name?: string } {
  return typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string';
}

async function pingSupabase(): Promise<boolean> {
  // First trust the browser: if the OS reports offline, we're offline.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    logger.warn('[ConnectionHealth] navigator.onLine === false');
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    const res = await fetch(SUPABASE_HEALTH_URL, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return !!res;
  } catch (err: unknown) {
    if (isErrorWithMessage(err) && (err.name === 'AbortError' || err.message.includes('abort'))) {
      logger.error('[ConnectionHealth] Ping aborted (timeout)');
      return false;
    }
    logger.error('[ConnectionHealth] Network unreachable:', err);
    return false;
  }
}

export function useConnectionHealth(): ConnectionHealth {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  const checkConnection = useCallback(async () => {
    if (!isMountedRef.current) return;

    logger.log('[ConnectionHealth] Checking connection...');
    const reachable = await pingSupabase();

    if (!isMountedRef.current) return;

    setLastChecked(new Date());

    if (reachable) {
      setStatus('connected');
      retryCountRef.current = 0;
      setRetryCount(0);
      logger.log('[ConnectionHealth] Connected ✓');
    } else {
      retryCountRef.current += 1;
      setRetryCount(retryCountRef.current);

      if (retryCountRef.current >= MAX_RETRIES) {
        setStatus('disconnected');
        logger.error('[ConnectionHealth] Disconnected after', retryCountRef.current, 'retries');
      } else {
        setStatus('degraded');
        logger.warn('[ConnectionHealth] Degraded, retry', retryCountRef.current, 'of', MAX_RETRIES);
        // Auto-retry with backoff
        setTimeout(() => {
          if (isMountedRef.current) checkConnection();
        }, 2000 * retryCountRef.current);
      }
    }
  }, []);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    setRetryCount(0);
    setStatus('checking');
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    isMountedRef.current = true;

    // Only check on initial load — don't check every render
    checkConnection();

    // Re-check when the browser regains network connectivity
    const handleOnline = () => {
      logger.log('[ConnectionHealth] Network online, re-checking...');
      setStatus('checking');
      retryCountRef.current = 0;
      setRetryCount(0);
      checkConnection();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
    };
  }, [checkConnection]);

  return { status, lastChecked, retryCount, retry };
}



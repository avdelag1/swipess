/**
 * Connection Health Hook
 *
 * Proactively checks if Supabase is reachable when the app loads.
 * Detects paused projects, network outages, or unreachable backends early
 * so the user sees a clear error instead of a frozen/blank screen.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

function isErrorWithMessage(err: unknown): err is { message: string; name?: string } {
  return typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string';
}

async function pingSupabase(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    // Use a lightweight query to verify the connection is alive
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    // PGRST116 = "not found" is fine — connection works
    // 42P01 = table doesn't exist — connection works
    // Any other error could mean connection issues, but we check the error type
    if (error && error.message?.includes('abort')) {
      logger.error('[ConnectionHealth] Request timed out');
      return false;
    }

    return true;
  } catch (err: unknown) {
    if (!isErrorWithMessage(err)) {
      logger.log('[ConnectionHealth] Supabase reachable (unknown error type)');
      return true;
    }

    if (err.name === 'AbortError' || err.message.includes('abort')) {
      logger.error('[ConnectionHealth] Ping aborted (timeout)');
      return false;
    }
    // Network error (fetch failed, CORS, etc.)
    if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed')) {
      logger.error('[ConnectionHealth] Network error:', err.message);
      return false;
    }
    // Any other Supabase error means the server IS reachable (project not paused)
    logger.log('[ConnectionHealth] Supabase reachable (non-critical error):', err.message);
    return true;
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


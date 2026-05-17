import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/prodLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

const RELOAD_KEY = 'swipess_global_reload_count';
const RELOAD_TS_KEY = 'swipess_global_reload_ts';
const MAX_RELOADS_PER_MINUTE = 3;

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('[GlobalErrorBoundary] caught', error?.message, errorInfo?.componentStack);

    try {
      const now = Date.now();
      const lastTs = parseInt(sessionStorage.getItem(RELOAD_TS_KEY) || '0', 10);
      let count = parseInt(sessionStorage.getItem(RELOAD_KEY) || '0', 10);
      if (now - lastTs > 60_000) count = 0;
      if (count < MAX_RELOADS_PER_MINUTE) {
        sessionStorage.setItem(RELOAD_KEY, String(count + 1));
        sessionStorage.setItem(RELOAD_TS_KEY, String(now));
        setTimeout(() => window.location.replace(window.location.pathname + '?v=' + Date.now()), 600);
        return;
      }
      // Reload limit hit — clear potentially corrupted stores so next manual reload is clean
      localStorage.removeItem('swipe-deck-store');
      localStorage.removeItem('swipe-deck-version');
    } catch { /* ignore */ }

    this.setState({ errorInfo });
  }

  private handleManualReload = () => {
    // Navigate to ?reset=1 which triggers full state wipe in main.tsx before React mounts
    window.location.href = window.location.pathname + '?reset=1&t=' + Date.now();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-dvh bg-black flex flex-col items-center justify-center p-6 gap-6">
          <div className="w-12 h-12 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
          <p className="text-sm text-white/50">Something went wrong</p>
          <button
            onClick={this.handleManualReload}
            className="px-6 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium active:scale-95 transition-transform"
          >
            Tap to refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;



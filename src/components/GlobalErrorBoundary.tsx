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
        setTimeout(() => window.location.reload(), 600);
        return;
      }
    } catch { /* ignore */ }

    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      // Silent self-healing splash — never expose error chrome to users.
      return (
        <div className="min-h-screen min-h-dvh bg-background flex flex-col items-center justify-center p-6">
          <div className="flex flex-col items-center gap-5">
            <div className="w-12 h-12 rounded-full border-2 border-foreground/15 border-t-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Reconnecting…</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;



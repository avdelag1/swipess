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
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-dvh bg-black flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center mb-8 border border-red-500/20">
            <div className="w-10 h-10 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-4">Something went wrong</h2>
          <p className="text-sm text-white/50 max-w-xs mb-8 leading-relaxed">
            The application encountered an unexpected error. We are attempting to recover.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-full hover:bg-white/90 transition-colors"
          >
            Restart Swipess
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;



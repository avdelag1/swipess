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
      const isDev = import.meta.env.DEV;
      return (
        <div className="min-h-screen min-h-dvh bg-black flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center mb-8 border border-red-500/20">
            <div className="w-10 h-10 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-4">Something went wrong</h2>
          <p className="text-sm text-white/50 max-w-xs mb-8 leading-relaxed">
            {isDev && this.state.error?.message
              ? this.state.error.message
              : 'The application encountered an unexpected error. We are attempting to recover.'}
          </p>
          {isDev && this.state.errorInfo?.componentStack && (
            <pre className="text-[10px] text-white/30 max-w-sm mb-6 text-left overflow-auto max-h-32 bg-white/5 rounded-xl p-3 font-mono">
              {this.state.errorInfo.componentStack.slice(0, 600)}
            </pre>
          )}
          <div className="flex flex-col gap-3 w-full max-w-[200px]">
            <button
              onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
              className="px-8 py-3 bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-full hover:bg-white/20 transition-colors border border-white/10"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-full hover:bg-white/90 transition-colors"
            >
              Restart Swipess
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;



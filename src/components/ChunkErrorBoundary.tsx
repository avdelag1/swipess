import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasChunkError: boolean;
  hasGeneralError: boolean;
  errorMsg: string;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasChunkError: false, hasGeneralError: false, errorMsg: '' };

  static getDerivedStateFromError(error: Error): State | null {
    const msg = error?.message || '';
    if (
      msg.includes('dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('Failed to fetch dynamically')
    ) {
      // Do NOT auto-reload here — main.tsx / lazyWithRetry already do one-time recovery.
      // Auto-reload from this boundary caused Chrome reload thrashing with the SW.
      return { hasChunkError: true, hasGeneralError: false, errorMsg: msg };
    }
    
    // For non-chunk errors, we MUST NOT throw inside getDerivedStateFromError!
    // Instead, update state so we can render a fallback or let componentDidCatch log it.
    return { hasChunkError: false, hasGeneralError: true, errorMsg: msg };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (!this.state.hasChunkError) {
      console.error('[ChunkErrorBoundary] Caught non-chunk error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasChunkError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6 text-center">
          <p className="text-sm text-muted-foreground">Something went wrong loading this section.</p>
          <button
            onClick={() => window.location.replace(window.location.pathname + '?v=' + Date.now())}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground"
          >
            Tap to retry
          </button>
        </div>
      );
    }
    
    if (this.state.hasGeneralError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6 text-center">
          <p className="text-sm text-red-500 font-bold">A component error occurred.</p>
          <p className="text-xs text-muted-foreground opacity-50">{this.state.errorMsg}</p>
          <button
            onClick={() => this.setState({ hasGeneralError: false, errorMsg: '' })}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}



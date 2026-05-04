import { Component, ReactNode } from 'react';

const RELOAD_KEY = '__swipess_chunk_reload__';

interface Props {
  children: ReactNode;
}

interface State {
  hasChunkError: boolean;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasChunkError: false };

  static getDerivedStateFromError(error: Error): State | null {
    const msg = error?.message || '';
    if (
      msg.includes('dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('Failed to fetch')
    ) {
      // One-shot auto-reload for stale deploys — prevents permanent white screen
      try {
        const last = Number(sessionStorage.getItem(RELOAD_KEY) || '0');
        if (Date.now() - last > 30000) {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
          window.location.reload();
          return { hasChunkError: true };
        }
      } catch {}
      return { hasChunkError: true };
    }
    return null;
  }

  render() {
    if (this.state.hasChunkError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6 text-center">
          <p className="text-sm text-muted-foreground">Something went wrong loading this section.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground"
          >
            Tap to retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}



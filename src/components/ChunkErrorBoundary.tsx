import { Component, ReactNode } from 'react';

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



import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface AppErrorProps {
  error: Error;
  resetError: () => void;
}

export function AppError({ error, resetError }: AppErrorProps) {
  const handleGoHome = () => {
    resetError();
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen min-h-dvh bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-destructive/30 bg-destructive/10">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Oops! Something went wrong</h2>
          <p className="text-muted-foreground mb-6">
            We encountered an unexpected error. Don't worry, we're working to fix it!
          </p>

          {import.meta.env.DEV && (
            <div className="w-full p-3 rounded-lg text-xs font-mono overflow-auto max-h-32 bg-destructive/10 border border-destructive/30 text-destructive text-left mb-6">
              <strong>Error:</strong> {error.message}
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer hover:opacity-80">Stack trace</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap break-all">{error.stack}</pre>
                </details>
              )}
            </div>
          )}

          <div className="w-full flex flex-col gap-2">
            <button
              onClick={resetError}
              className="w-full h-12 bg-destructive text-destructive-foreground rounded-xl font-medium text-base active:scale-[0.98] transition-transform"
            >
              Try Again
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleGoHome}
                className="flex-1 h-10 bg-secondary text-secondary-foreground rounded-xl font-medium text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
              <button
                onClick={handleReload}
                className="flex-1 h-10 bg-secondary text-secondary-foreground rounded-xl font-medium text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
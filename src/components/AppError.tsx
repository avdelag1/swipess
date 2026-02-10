import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AppErrorProps {
  error: Error;
  resetError: () => void;
}

export function AppError({ error, resetError }: AppErrorProps) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    resetError();
    navigate('/', { replace: true });
  };

  const handleReload = () => {
    // Keep window.location.reload() for full reload scenario
    // This clears any corrupted state that a soft navigation might not fix
    window.location.reload();
  };

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/90 border-white/10">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-xl text-white">Oops! Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white/70 text-center">
            We encountered an unexpected error. Don't worry, we're working to fix it!
          </p>

          {import.meta.env.DEV && (
            <div className="bg-black/40 border border-white/10 p-3 rounded-lg text-xs font-mono text-red-300 overflow-auto max-h-32">
              <strong>Error:</strong> {error.message}
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer hover:text-red-200">Stack trace</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap break-all">{error.stack}</pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={resetError}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              Try Again
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
              <Button
                onClick={handleReload}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload
              </Button>
            </div>
          </div>

          <p className="text-xs text-white/50 text-center mt-4">
            If this problem persists, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
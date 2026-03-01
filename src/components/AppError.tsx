import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import { getSemanticColor } from '@/utils/colors';
import { cn } from '@/lib/utils';

interface AppErrorProps {
  error: Error;
  resetError: () => void;
}

export function AppError({ error, resetError }: AppErrorProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme !== 'white-matte';

  const handleGoHome = () => {
    resetError();
    navigate('/', { replace: true });
  };

  const handleReload = () => {
    // Keep window.location.reload() for full reload scenario
    // This clears any corrupted state that a soft navigation might not fix
    window.location.reload();
  };

  const errorBgColor = getSemanticColor('error', 'bgLight', isDark);
  const errorTextColor = getSemanticColor('error', 'text', isDark);
  const errorBorderColor = getSemanticColor('error', 'border', isDark);

  return (
    <div className="min-h-screen min-h-dvh bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border',
              errorBgColor,
              errorBorderColor
            )}
          >
            <AlertTriangle className={cn('w-8 h-8', errorTextColor)} />
          </div>
          <CardTitle className="text-xl">Oops! Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            We encountered an unexpected error. Don't worry, we're working to fix it!
          </p>

          {import.meta.env.DEV && (
            <div className={cn('p-3 rounded-lg text-xs font-mono overflow-auto max-h-32', errorBgColor, 'border', errorBorderColor)}>
              <strong>Error:</strong> {error.message}
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer hover:opacity-80">Stack trace</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap break-all">{error.stack}</pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={resetError}
              className={cn('w-full text-white', getSemanticColor('error', 'bg', isDark))}
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
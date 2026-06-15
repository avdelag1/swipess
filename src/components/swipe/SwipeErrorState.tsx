import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface SwipeErrorStateProps {
  onRetry: () => void;
  isRetrying?: boolean;
  message?: string;
}

export function SwipeErrorState({
  onRetry,
  isRetrying = false,
  message = 'Could not load listings. Check your connection and try again.',
}: SwipeErrorStateProps) {
  const { isLight } = useAppTheme();

  return (
    <div
      className={cn(
        'relative z-50 h-full w-full flex flex-col items-center justify-center px-6 py-8',
        isLight ? 'bg-white' : 'bg-[#0a0a0c]',
      )}
    >
      <div className="flex flex-col items-center text-center w-full max-w-md gap-6">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            isLight ? 'bg-rose-50 text-rose-500' : 'bg-rose-500/15 text-rose-400',
          )}
        >
          <AlertTriangle className="w-8 h-8" strokeWidth={2} />
        </div>

        <div className="space-y-2">
          <h2 className={cn('text-2xl font-black tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>
            Connection issue
          </h2>
          <p className={cn('text-sm leading-relaxed', isLight ? 'text-slate-500' : 'text-white/60')}>
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onRetry();
          }}
          disabled={isRetrying}
          className={cn(
            'inline-flex h-12 min-w-[160px] items-center justify-center gap-2 rounded-full px-6 text-sm font-black transition-transform active:scale-[0.98] disabled:opacity-60',
            isLight ? 'bg-slate-900 text-white' : 'bg-white text-slate-900',
          )}
        >
          <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Retrying…' : 'Try again'}
        </button>
      </div>
    </div>
  );
}
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
            'w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-xl border shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
            isLight
              ? 'bg-rose-50/80 border-rose-200 text-rose-500'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          )}
        >
          <AlertTriangle className="w-9 h-9" strokeWidth={2} />
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
            'inline-flex h-14 min-w-[160px] items-center justify-center gap-2 rounded-full px-8 text-sm font-black transition-all duration-300 active:scale-85 disabled:opacity-60 shadow-[0_16px_48px_rgba(0,0,0,0.4)]',
            isLight
              ? 'bg-slate-900 text-white border border-white/10'
              : 'bg-white/10 backdrop-blur-3xl text-white border border-white/30',
          )}
        >
          <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Retrying…' : 'Try again'}
        </button>
      </div>
    </div>
  );
}
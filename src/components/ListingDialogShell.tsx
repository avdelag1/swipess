import { cn } from '@/lib/utils';

/** Instant overlay shown while listing form chunks load — avoids blank "thinking" gap. */
export function ListingDialogShell({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[10001] modal-scrim flex items-center justify-center pointer-events-none',
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          'w-full h-[100dvh] sm:h-[85vh] sm:max-w-2xl sm:rounded-[3rem]',
          'bg-white dark:bg-[#0a0a0a] border border-border/40 opacity-95',
        )}
      />
    </div>
  );
}
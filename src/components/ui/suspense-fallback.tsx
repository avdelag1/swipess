import { cn } from '@/lib/utils';
import { PremiumLoader } from '../PremiumLoader';

interface SuspenseFallbackProps {
  className?: string;
  minimal?: boolean;
}

export function SuspenseFallback({ className, minimal = false }: SuspenseFallbackProps) {
  // If minimal, it's just a spacer/skeleton fallback
  if (minimal) {
    return (
      <div className={cn("h-full w-full flex items-center justify-center bg-background", className)}>
        <PremiumLoader size="sm" />
      </div>
    );
  }

  // Full splash version - fixed, pure black, no scrollbars
  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#000000] overflow-hidden overscroll-none touch-none',
        className
      )}
      aria-hidden="true"
    >
      <PremiumLoader size="lg" />
    </div>
  );
}

export default SuspenseFallback;

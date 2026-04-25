import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

interface SwipeExhaustedStateProps {
  radiusKm?: number;
  onRadiusChange?: (km: number) => void;
}

export const SwipeExhaustedState = ({
  radiusKm = 50,
  onRadiusChange
}: SwipeExhaustedStateProps) => {
  const { isLight } = useAppTheme();

  return (
    <div className="relative z-50 h-full w-full flex flex-col items-center justify-center bg-transparent px-6">
      <div className="flex flex-col items-center text-center gap-6">
        <div className={cn("text-lg font-bold", isLight ? "text-black/60" : "text-white/60")}>
          No listings found
        </div>
        <div className={cn("text-sm", isLight ? "text-black/40" : "text-white/40")}>
          Try increasing your search radius or change filters
        </div>
      </div>
    </div>
  );
};


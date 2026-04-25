import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { DistanceSlider } from './DistanceSlider';

interface SwipeExhaustedStateProps {
  radiusKm?: number;
  onRadiusChange?: (km: number) => void;
  onDetectLocation?: () => void;
  detecting?: boolean;
  detected?: boolean;
  categoryName?: string;
  [key: string]: any;
}

export const SwipeExhaustedState = ({
  radiusKm = 50,
  onRadiusChange,
  onDetectLocation,
  detecting = false,
  detected = false,
  categoryName = 'listings',
}: SwipeExhaustedStateProps) => {
  const { isLight } = useAppTheme();

  return (
    <div className="relative z-50 h-full w-full flex flex-col items-center justify-center bg-transparent px-6">
      <div className="flex flex-col items-center text-center w-full max-w-sm gap-4">
        <p className={cn("text-sm font-bold uppercase tracking-wider", isLight ? "text-black/50" : "text-white/50")}>
          No {categoryName} found nearby
        </p>

        <h2 className={cn("text-2xl font-black tracking-tight", isLight ? "text-black" : "text-white")}>
          Adjust your distance
        </h2>

        {/* Distance slider — centered, the main control */}
        {onRadiusChange && onDetectLocation && (
          <div className={cn(
            "w-full rounded-3xl border p-2 mt-2",
            isLight ? "bg-white border-black/10" : "bg-white/5 border-white/10"
          )}>
            <DistanceSlider
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              onDetectLocation={onDetectLocation}
              detecting={detecting}
              detected={detected}
            />
          </div>
        )}

        <p className={cn("text-xs", isLight ? "text-black/40" : "text-white/40")}>
          Move the slider to search further
        </p>
      </div>
    </div>
  );
};

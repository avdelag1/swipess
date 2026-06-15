import { cn } from '@/lib/utils';
import { DEFAULT_CITY_PHOTO, getCityPhoto } from '@/data/cityPhotos';

interface CityQuickChipProps {
  name: string;
  lat?: number;
  lng?: number;
  selected?: boolean;
  onClick: () => void;
  className?: string;
}

export function CityQuickChip({ name, lat, lng, selected, onClick, className }: CityQuickChipProps) {
  const photo = getCityPhoto(name, lat != null && lng != null ? { lat, lng } : undefined);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 h-8 pl-1 pr-2.5 rounded-full text-xs font-semibold border transition-colors',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background border-border text-foreground hover:bg-accent',
        className,
      )}
    >
      <span className="w-6 h-6 rounded-full overflow-hidden shrink-0 ring-1 ring-black/10">
        <img
          src={photo}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = DEFAULT_CITY_PHOTO; }}
        />
      </span>
      {name}
    </button>
  );
}
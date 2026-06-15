import { memo, useMemo } from 'react';
import { Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MapListingPin, MapProfilePin } from '@/hooks/usePassportMapData';
import type { MapLayerFilter, SelectedPin } from './passportMapMarkers';
import { categoryLabel, formatDistanceKm } from './passportMapMarkers';

type RailItem =
  | { kind: 'listing'; data: MapListingPin }
  | { kind: 'profile'; data: MapProfilePin };

interface PassportMapResultsRailProps {
  listings: MapListingPin[];
  profiles: MapProfilePin[];
  filter: MapLayerFilter;
  selectedId: string | null;
  isLight: boolean;
  onSelect: (pin: SelectedPin) => void;
}

export const PassportMapResultsRail = memo(({
  listings,
  profiles,
  filter,
  selectedId,
  isLight,
  onSelect,
}: PassportMapResultsRailProps) => {
  const items = useMemo(() => {
    const merged: RailItem[] = [];
    if (filter !== 'people') {
      listings.forEach((l) => merged.push({ kind: 'listing', data: l }));
    }
    if (filter !== 'listings') {
      profiles.forEach((p) => merged.push({ kind: 'profile', data: p }));
    }
    return merged.sort((a, b) => (a.data.distanceKm ?? 99) - (b.data.distanceKm ?? 99));
  }, [listings, profiles, filter]);

  if (items.length === 0) return null;

  return (
    <div className="absolute bottom-3 left-0 right-0 z-20 pointer-events-none">
      <p className={cn(
        'px-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em]',
        isLight ? 'text-slate-600' : 'text-white/50',
      )}>
        {items.length} nearby — tap to preview
      </p>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 pointer-events-auto custom-scrollbar snap-x snap-mandatory">
        {items.map((item) => {
          const id = item.data.id;
          const isSelected = selectedId === id;
          const isListing = item.kind === 'listing';
          const title = isListing ? item.data.title : item.data.name;
          const meta = isListing
            ? [item.data.price != null ? `$${item.data.price.toLocaleString()}` : null, categoryLabel(item.data.category)].filter(Boolean).join(' · ')
            : [item.data.city, formatDistanceKm(item.data.distanceKm)].filter(Boolean).join(' · ');

          return (
            <button
              key={`${item.kind}-${id}`}
              type="button"
              onClick={() => onSelect(
                isListing
                  ? { type: 'listing', data: item.data }
                  : { type: 'profile', data: item.data },
              )}
              className={cn(
                'snap-start shrink-0 w-[148px] rounded-2xl overflow-hidden text-left transition-all active:scale-[0.97]',
                isSelected
                  ? 'ring-2 ring-indigo-400 shadow-xl shadow-indigo-500/20'
                  : 'ring-1 ring-black/10 shadow-lg',
                isLight ? 'bg-white' : 'bg-[#161616] ring-white/10',
              )}
            >
              <div className="relative h-24 bg-slate-800">
                {item.data.imageUrl ? (
                  <img src={item.data.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className={cn(
                    'w-full h-full flex items-center justify-center',
                    isListing ? 'bg-pink-900/30' : 'bg-indigo-900/40',
                  )}>
                    {isListing ? <Home className="w-6 h-6 text-white/50" /> : <User className="w-6 h-6 text-white/50" />}
                  </div>
                )}
                <span className={cn(
                  'absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase',
                  isListing ? 'bg-pink-500 text-white' : 'bg-indigo-500 text-white',
                )}>
                  {isListing ? 'Listing' : 'Person'}
                </span>
              </div>
              <div className="p-2.5">
                <p className={cn('text-xs font-black truncate', isLight ? 'text-slate-900' : 'text-white')}>{title}</p>
                <p className={cn('text-[10px] font-medium truncate mt-0.5', isLight ? 'text-slate-500' : 'text-white/45')}>{meta}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
PassportMapResultsRail.displayName = 'PassportMapResultsRail';
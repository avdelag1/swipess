import { memo, useMemo } from 'react';
import { Home, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MapListingPin, MapProfilePin } from '@/hooks/usePassportMapData';
import type { MapLayerFilter, SelectedPin } from './passportMapMarkers';
import { categoryLabel, formatDistanceKm } from './passportMapMarkers';
import { PASSPORT_GRADIENTS } from './passportMapTheme';

type RailItem =
  | { kind: 'listing'; data: MapListingPin }
  | { kind: 'profile'; data: MapProfilePin };

interface PassportMapResultsRailProps {
  listings: MapListingPin[];
  profiles: MapProfilePin[];
  filter: MapLayerFilter;
  selectedId: string | null;
  activePeopleCount?: number;
  onSelect: (pin: SelectedPin) => void;
}

export const PassportMapResultsRail = memo(({
  listings,
  profiles,
  filter,
  selectedId,
  activePeopleCount = 0,
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
    <div className="w-full pointer-events-none">
      <p className="px-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white drop-shadow-md flex items-center gap-2">
        <span>{items.length} in your radius</span>
        {activePeopleCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] text-white" style={{ background: PASSPORT_GRADIENTS.tokens }}>
            <Zap className="w-3 h-3" />
            {activePeopleCount} active
          </span>
        )}
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
                'snap-start shrink-0 w-[152px] rounded-2xl overflow-hidden text-left transition-all active:scale-[0.96]',
                isSelected ? 'ring-2 ring-white shadow-2xl scale-[1.02]' : 'ring-1 ring-white/20 shadow-xl',
              )}
              style={{
                boxShadow: isSelected
                  ? '0 12px 32px rgba(99,102,241,0.45)'
                  : '0 8px 24px rgba(0,0,0,0.35)',
              }}
            >
              <div className="relative h-24">
                {item.data.imageUrl ? (
                  <img src={item.data.imageUrl} alt={title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: isListing ? PASSPORT_GRADIENTS.listings : PASSPORT_GRADIENTS.people }}
                  >
                    {isListing ? <Home className="w-6 h-6 text-white/80" /> : <User className="w-6 h-6 text-white/80" />}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span
                  className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase text-white"
                  style={{ background: isListing ? PASSPORT_GRADIENTS.listings : PASSPORT_GRADIENTS.people }}
                >
                  {isListing ? 'Listing' : 'Person'}
                </span>
                {!isListing && item.data.recentlyActive && (
                  <span
                    className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)' }}
                    title="Recently active"
                  />
                )}
              </div>
              <div className="p-2.5 deck-hud-solid">
                <p className="text-xs font-black truncate text-white">{title}</p>
                <p className="text-[10px] font-medium truncate mt-0.5 text-white/55">{meta}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
PassportMapResultsRail.displayName = 'PassportMapResultsRail';
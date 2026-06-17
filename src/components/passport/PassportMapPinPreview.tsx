import { memo, useEffect, useState } from 'react';
import {
  Bed, Briefcase, Car, Eye, Footprints, MapPin, Sparkles, User, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SelectedPin } from './passportMapMarkers';
import { categoryLabel, formatDistanceKm } from './passportMapMarkers';
import { PASSPORT_GRADIENTS } from './passportMapTheme';
import { useFilterStore } from '@/state/filterStore';
import { getTravelTime, type TravelTimeResult } from '@/utils/mapboxDirections';

interface PassportMapPinPreviewProps {
  selected: SelectedPin;
  isLight: boolean;
  onClose: () => void;
  onInsights: () => void;
  onDetails?: () => void;
  /** Anchored popover above/below the tapped map pin (default). */
  variant?: 'anchored' | 'sheet';
}

export const PassportMapPinPreview = memo(({
  selected,
  isLight,
  onClose,
  onInsights,
  onDetails,
}: PassportMapPinPreviewProps) => {
  const isListing = selected.type === 'listing';
  const data = selected.data;
  const userLat = useFilterStore(s => s.userLatitude);
  const userLng = useFilterStore(s => s.userLongitude);

  const [travelTime, setTravelTime] = useState<TravelTimeResult | null>(null);

  useEffect(() => {
    if (userLat == null || userLng == null) return;
    let cancelled = false;

    const profile = data.distanceKm && data.distanceKm < 2 ? 'walking' : 'driving';

    getTravelTime(userLng, userLat, data.lng, data.lat, profile).then(result => {
      if (!cancelled && result) {
        setTravelTime({ ...result, profile } as TravelTimeResult & { profile: string });
      }
    });

    return () => { cancelled = true; };
  }, [userLat, userLng, data.lat, data.lng, data.distanceKm]);

  const title = isListing ? data.title : data.name;
  const subtitle = [data.city, formatDistanceKm(data.distanceKm)].filter(Boolean).join(' · ');
  const bioSnippet = !isListing && data.bio ? data.bio.slice(0, 80) + (data.bio.length > 80 ? '…' : '') : null;

  return (
    <div
      style={{ willChange: 'transform' }}
      className={cn(
        'overflow-hidden z-30 shadow-[0_32px_64px_rgba(0,0,0,0.55)]',
        // On mobile: max-w-[420px], anchored bottom
        // On tablet/desktop: acts as a tall side panel
        'w-full max-w-[420px] shrink-0 mx-3 mb-[calc(env(safe-area-inset-bottom,0px)+12px)] rounded-[2.5rem]',
        'md:w-[380px] md:h-auto md:max-h-[80vh] md:mx-0 md:mb-0 md:rounded-3xl',
        isLight ? 'bg-white border border-slate-200' : 'bg-[#111827] border border-white/10 text-white',
      )}
    >
      <div className="relative w-full bg-slate-900 h-48 md:h-56">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center',
            isListing ? 'bg-gradient-to-br from-[#00C6FF]/40 to-[#0072FF]/90' : 'bg-gradient-to-br from-indigo-600/50 to-purple-900',
          )}>
            {isListing ? <MapPin className="w-10 h-10 text-white/60" /> : <User className="w-10 h-10 text-white/60" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3">
          <div className="flex flex-wrap items-start gap-2 min-w-0">
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md max-w-[150px] truncate"
              style={{ background: isListing ? PASSPORT_GRADIENTS.listings : PASSPORT_GRADIENTS.people }}
            >
              {isListing ? categoryLabel(data.category) : 'Person'}
            </span>
          </div>

          <button
            type="button"
            data-no-cinematic
            onClick={onClose}
            className="map-hud-btn shrink-0 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 p-2 shadow-lg transition-all"
            aria-label="Close preview"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        
        {/* Floating save button */}
        {isListing && (
          <button className="absolute bottom-4 right-4 w-10 h-10 bg-white/95 rounded-full flex items-center justify-center shadow-lg text-slate-400 hover:text-rose-500 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </button>
        )}
      </div>

      <div className="p-5 md:p-6 flex flex-col gap-4">
        {/* Header Info */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className={cn("font-black text-xl leading-tight truncate", isLight ? "text-slate-900" : "text-white")}>
              {title}
            </h3>
            {isListing && data.price != null && (
              <span className="text-lg font-black text-emerald-500 shrink-0">
                ${data.price.toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
            {subtitle && <span>{subtitle}</span>}
            <div className="flex items-center gap-1 text-amber-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>4.9</span>
            </div>
          </div>
        </div>

        {/* Travel Time & Stats */}
        <div className="flex flex-wrap items-center gap-2">
          {travelTime && (
            <span className={cn(
              "px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5",
              isLight ? "bg-slate-100 text-slate-600" : "bg-slate-800 text-slate-300"
            )}>
              {(travelTime as TravelTimeResult & { profile?: string }).profile === 'walking'
                ? <Footprints className="w-3.5 h-3.5" />
                : <Car className="w-3.5 h-3.5" />}
              {travelTime.formattedDuration}
            </span>
          )}

          {isListing && (data.bedrooms != null || data.bathrooms != null) && (
            <div className={cn("flex gap-3 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider", isLight ? "bg-slate-100 text-slate-600" : "bg-slate-800 text-slate-400")}>
              {data.bedrooms != null && (
                <span className="flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5" /> {data.bedrooms} bed
                </span>
              )}
              {data.bathrooms != null && (
                <span className="flex items-center gap-1">
                  <span className="text-sm">🛁</span> {data.bathrooms} bath
                </span>
              )}
            </div>
          )}

          {!isListing && (data.occupation || data.age) && (
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold", isLight ? "bg-slate-100 text-slate-600" : "bg-slate-800 text-slate-400")}>
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {[data.occupation, data.age ? `${data.age} yrs` : null].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
        </div>

        {bioSnippet && (
          <p className={cn('text-sm leading-relaxed mt-1', isLight ? 'text-slate-600' : 'text-slate-300')}>
            {bioSnippet}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-2">
          <button
            type="button"
            data-no-cinematic
            onClick={onInsights}
            className={cn(
              'map-hud-btn flex-1 rounded-2xl flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest text-white transition-all shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:scale-[1.02]',
            )}
            style={{
              background: isListing ? PASSPORT_GRADIENTS.listings : PASSPORT_GRADIENTS.passport,
            }}
          >
            <Sparkles className="w-4 h-4" />
            Insights
          </button>
          
          {isListing && onDetails && (
            <button
              type="button"
              data-no-cinematic
              onClick={onDetails}
              className={cn(
                'map-hud-btn flex-1 rounded-2xl flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest text-slate-800 bg-[#00E5FF] transition-all shadow-[0_8px_20px_rgba(0,229,255,0.3)] hover:scale-[1.02]',
              )}
            >
              <Eye className="w-4 h-4" />
              View
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
PassportMapPinPreview.displayName = 'PassportMapPinPreview';
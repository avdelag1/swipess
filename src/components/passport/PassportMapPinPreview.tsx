import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bed, Briefcase, Eye, MapPin, Sparkles, User, X, Car, Footprints
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
  variant = 'anchored',
}: PassportMapPinPreviewProps) => {
  const isListing = selected.type === 'listing';
  const data = selected.data;
  const userLat = useFilterStore(s => s.userLatitude);
  const userLng = useFilterStore(s => s.userLongitude);
  const isAnchored = variant === 'anchored';

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
    <motion.div
      initial={{ scale: 0.92, opacity: 0, y: isAnchored ? 8 : 24 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.94, opacity: 0, y: isAnchored ? 6 : 16 }}
      transition={{ type: 'spring', damping: 24, stiffness: 380 }}
      className={cn(
        'overflow-hidden z-30 shadow-[0_16px_40px_rgba(0,0,0,0.45)]',
        isAnchored
          ? 'w-[min(280px,calc(100vw-32px))] rounded-2xl'
          : 'w-full max-w-md shrink-0 mx-3 mb-[calc(env(safe-area-inset-bottom,0px)+12px)] rounded-[1.75rem] shadow-[0_-12px_40px_rgba(0,0,0,0.35)]',
        isLight ? 'bg-white border border-black/8' : 'bg-[#111] border border-white/10',
      )}
    >
      <div className={cn('relative w-full bg-slate-900', isAnchored ? 'h-24' : 'h-36')}>
        {data.imageUrl ? (
          <img src={data.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center',
            isListing ? 'bg-gradient-to-br from-[#00C6FF]/40 to-[#0072FF]/90' : 'bg-gradient-to-br from-indigo-600/50 to-purple-900',
          )}>
            {isListing ? <MapPin className="w-8 h-8 text-white/60" /> : <User className="w-8 h-8 text-white/60" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 glass-pill bg-black/40 backdrop-blur-md p-1.5 z-10"
          aria-label="Close preview"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 max-w-[calc(100%-3rem)]">
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white"
            style={{ background: isListing ? PASSPORT_GRADIENTS.listings : PASSPORT_GRADIENTS.people }}
          >
            {isListing ? categoryLabel(data.category) : 'Person'}
          </span>
          {isListing && data.price != null && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/95 text-slate-900">
              ${data.price.toLocaleString()}
            </span>
          )}
          {travelTime && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black deck-hud-solid text-white flex items-center gap-1 border border-white/20">
              {(travelTime as TravelTimeResult & { profile?: string }).profile === 'walking'
                ? <Footprints className="w-3 h-3" />
                : <Car className="w-3 h-3" />}
              {travelTime.formattedDuration}
            </span>
          )}
        </div>

        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="text-white font-black text-sm leading-tight truncate">{title}</h3>
          {subtitle && <p className="text-white/70 text-[10px] font-medium mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className={cn('space-y-2', isAnchored ? 'p-3' : 'p-4 space-y-3')}>
        {isListing && (data.bedrooms != null || data.bathrooms != null) && (
          <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider text-white/50">
            {data.bedrooms != null && (
              <span className={cn('flex items-center gap-1', isLight ? 'text-slate-500' : 'text-white/50')}>
                <Bed className="w-3 h-3" /> {data.bedrooms} bed
              </span>
            )}
            {data.bathrooms != null && (
              <span className={cn('flex items-center gap-1', isLight ? 'text-slate-500' : 'text-white/50')}>
                <span className="text-xs">🛁</span> {data.bathrooms} bath
              </span>
            )}
          </div>
        )}

        {!isListing && (data.occupation || data.age) && (
          <div className={cn('flex items-center gap-2 text-[10px] font-bold', isLight ? 'text-slate-500' : 'text-white/50')}>
            <Briefcase className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {[data.occupation, data.age ? `${data.age} yrs` : null].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}

        {bioSnippet && !isAnchored && (
          <p className={cn('text-sm leading-relaxed line-clamp-2', isLight ? 'text-slate-600' : 'text-white/60')}>
            {bioSnippet}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onInsights}
            className={cn(
              'flex-1 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98] shadow-lg',
              isAnchored ? 'py-2.5' : 'py-3.5 rounded-2xl',
            )}
            style={{
              background: isListing ? PASSPORT_GRADIENTS.listings : PASSPORT_GRADIENTS.passport,
              boxShadow: isListing ? '0 8px 24px rgba(0,114,255,0.4)' : '0 8px 24px rgba(99,102,241,0.4)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Insights
          </button>
          {isListing && onDetails && (
            <button
              type="button"
              onClick={onDetails}
              className={cn(
                'px-3 rounded-xl flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98]',
                isAnchored ? 'py-2.5' : 'py-3.5 rounded-2xl',
              )}
              style={{ background: PASSPORT_GRADIENTS.tokens }}
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
PassportMapPinPreview.displayName = 'PassportMapPinPreview';
import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Bed, Briefcase, Eye, MapPin, Sparkles, User, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SelectedPin } from './passportMapMarkers';
import { categoryLabel, formatDistanceKm } from './passportMapMarkers';

interface PassportMapPinPreviewProps {
  selected: SelectedPin;
  isLight: boolean;
  onClose: () => void;
  onInsights: () => void;
  onDetails?: () => void;
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

  const title = isListing ? data.title : data.name;
  const subtitle = [data.city, formatDistanceKm(data.distanceKm)].filter(Boolean).join(' · ');
  const bioSnippet = !isListing && data.bio ? data.bio.slice(0, 120) + (data.bio.length > 120 ? '…' : '') : null;

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 16, opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className={cn(
        'shrink-0 mx-3 mb-[calc(env(safe-area-inset-bottom,0px)+12px)] rounded-[1.75rem] overflow-hidden z-30 shadow-[0_-12px_40px_rgba(0,0,0,0.35)]',
        isLight ? 'bg-white border border-black/8' : 'bg-[#111] border border-white/10',
      )}
    >
      <div className="relative h-36 w-full bg-slate-900">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center',
            isListing ? 'bg-gradient-to-br from-pink-600/40 to-purple-900' : 'bg-gradient-to-br from-indigo-600/50 to-purple-900',
          )}>
            {isListing ? <MapPin className="w-10 h-10 text-white/60" /> : <User className="w-10 h-10 text-white/60" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 glass-pill p-2 z-10"
          aria-label="Close preview"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="absolute top-3 left-3 flex gap-2">
          <span className={cn(
            'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
            isListing ? 'bg-pink-500/90 text-white' : 'bg-indigo-500/90 text-white',
          )}>
            {isListing ? categoryLabel(data.category) : 'Person'}
          </span>
          {isListing && data.price != null && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-white/95 text-slate-900">
              ${data.price.toLocaleString()}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-white font-black text-lg leading-tight truncate">{title}</h3>
          {subtitle && <p className="text-white/70 text-xs font-medium mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isListing && (data.bedrooms != null || data.bathrooms != null) && (
          <div className="flex gap-3 text-[11px] font-bold uppercase tracking-wider text-white/50">
            {data.bedrooms != null && (
              <span className={cn('flex items-center gap-1', isLight ? 'text-slate-500' : 'text-white/50')}>
                <Bed className="w-3.5 h-3.5" /> {data.bedrooms} bed
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
          <div className={cn('flex items-center gap-2 text-xs font-bold', isLight ? 'text-slate-500' : 'text-white/50')}>
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {[data.occupation, data.age ? `${data.age} yrs` : null].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}

        {bioSnippet && (
          <p className={cn('text-sm leading-relaxed line-clamp-2', isLight ? 'text-slate-600' : 'text-white/60')}>
            {bioSnippet}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onInsights}
            className={cn(
              'flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98]',
              isListing
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25'
                : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25',
            )}
          >
            <Sparkles className="w-4 h-4" />
            Full Insights
          </button>
          {isListing && onDetails && (
            <button
              type="button"
              onClick={onDetails}
              className={cn(
                'px-4 py-3 rounded-2xl flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-widest border transition-all active:scale-[0.98]',
                isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'border-white/15 text-white/80 hover:bg-white/5',
              )}
            >
              <Eye className="w-4 h-4" />
              Details
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
PassportMapPinPreview.displayName = 'PassportMapPinPreview';
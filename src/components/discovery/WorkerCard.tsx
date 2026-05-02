import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Clock, MessageCircle } from 'lucide-react';
import { findCategory } from '@/data/serviceCategories';
import { PRICING_UNITS } from '@/components/WorkerListingForm';
import { SaveButton } from '@/components/SaveButton';
import { triggerHaptic } from '@/utils/haptics';
import { SwipessLogo } from '@/components/SwipessLogo';
import { getCardImageUrl } from '@/utils/imageOptimization';

export interface WorkerListing {
  id: string;
  title: string | null;
  description: string | null;
  price: number | null;
  images: string[] | null;
  city: string | null;
  service_category?: string | null;
  pricing_unit?: string | null;
  experience_years?: number | null;
  availability?: string | null;
  owner_id: string;
  owner?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface WorkerCardProps {
  worker: WorkerListing;
  onContact: (userId: string) => void;
  priority?: boolean;
}

export const WorkerCard = memo(({ worker, onContact, priority = false }: WorkerCardProps) => {
  const categoryInfo = findCategory(worker.service_category || '');
  const pricingInfo = PRICING_UNITS.find(p => p.value === worker.pricing_unit);
  const imageUrl = worker.images?.[0];
  const optimizedImage = imageUrl ? getCardImageUrl(imageUrl, 600) : null;

  return (
    <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] rounded-[32px] overflow-hidden group shadow-2xl bg-black">
      {/* Background Layer */}
      {optimizedImage ? (
        <img 
          src={optimizedImage} 
          alt={worker.title || 'Service'} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading={priority ? 'eager' : 'lazy'}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-black flex flex-col items-center justify-center p-6 text-center">
          <div className="scale-75 opacity-40 mb-6">
             <SwipessLogo isIcon={false} size="md" variant="white" />
          </div>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">
            Waiting for users to upload their photos
          </p>
        </div>
      )}

      {/* Dark Vignette Overlay for Text Legibility */}
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

      {/* Top Badges */}
      <div className="absolute top-5 left-5 right-5 flex justify-between z-10 pointer-events-none">
        <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2">
           <span className="text-[10px] font-black text-white tracking-widest uppercase">
             {categoryInfo?.icon} {categoryInfo?.label || worker.service_category}
           </span>
        </div>
        
        {pricingInfo && (
          <div className="px-3 py-1.5 rounded-full bg-rose-500/80 backdrop-blur-md border border-rose-500/20 flex items-center gap-2">
             <span className="text-[10px] font-black text-white tracking-widest uppercase">
               {pricingInfo.label}
             </span>
          </div>
        )}
      </div>

      {/* Content Layer (Bottom Left Aligned) */}
      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end z-10 pointer-events-none">
        {/* Title and Price */}
        <div className="flex items-end justify-between gap-4 mb-2">
          <h3 className="text-2xl font-black text-white leading-none tracking-tighter line-clamp-2">
            {worker.title || 'Untitled Service'}
          </h3>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-xl font-black text-white tracking-tighter font-mono">
              {(worker.price ?? 0) > 0 ? `$${worker.price}` : 'Quote'}
            </span>
          </div>
        </div>

        {/* Location & Tags */}
        <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          {worker.city || 'Location not set'}
        </p>

        {/* Insight Pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {worker.experience_years && (
            <Badge variant="outline" className="text-[10px] font-bold py-1 px-3 bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center gap-1.5 whitespace-nowrap">
              <Star className="w-3 h-3 text-amber-400" />
              {worker.experience_years} yrs exp
            </Badge>
          )}
          {worker.availability && (
            <Badge variant="outline" className="text-[10px] font-bold py-1 px-3 bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center gap-1.5 whitespace-nowrap">
              <Clock className="w-3 h-3 text-blue-400" />
              {worker.availability.slice(0, 15)}
            </Badge>
          )}
          {worker.owner?.full_name && (
            <Badge variant="outline" className="text-[10px] font-bold py-1 px-3 bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center gap-1.5 whitespace-nowrap">
              {worker.owner.avatar_url ? (
                 <img src={worker.owner.avatar_url} className="w-4 h-4 rounded-full" />
              ) : (
                 <div className="w-4 h-4 rounded-full bg-primary/40" />
              )}
              {worker.owner.full_name}
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2 pointer-events-auto">
          <SaveButton 
            targetId={worker.id}
            targetType="listing"
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all shrink-0 text-white"
            variant="circular"
          />

          <button 
            onClick={() => {
              triggerHaptic('light');
              onContact(worker.owner_id);
            }}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-full text-[11px] font-black uppercase tracking-widest text-white transition-all active:scale-95 bg-gradient-to-r from-rose-500 via-pink-600 to-orange-500 shadow-lg shadow-rose-500/25"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Contact</span>
          </button>
        </div>
      </div>
    </div>
  );
});

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Star, Clock, MessageCircle } from 'lucide-react';
import { findCategory } from '@/data/serviceCategories';
import { PRICING_UNITS } from '@/components/WorkerListingForm';
import { SaveButton } from '@/components/SaveButton';
import { triggerHaptic } from '@/utils/haptics';
import CardImage from '@/components/CardImage';

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

  return (
    <Card className="overflow-hidden rounded-2xl transition-all shadow-sm border-border/40 bg-card hover:shadow-lg hover:border-border/60 group">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <CardImage 
          src={worker.images?.[0]} 
          alt={worker.title ?? 'Worker'} 
          name={worker.title || undefined}
          priority={priority}
        />
        <Badge className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm z-10">
          {categoryInfo?.icon} {categoryInfo?.label || worker.service_category}
        </Badge>
        {pricingInfo && (
          <Badge className="absolute top-2 right-2 bg-rose-500/90 text-white backdrop-blur-sm z-10">
            {pricingInfo.label}
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title and Owner */}
        <div>
          <h3 className="font-semibold text-lg line-clamp-1">{worker.title}</h3>
          {worker.owner && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-muted">
                {worker.owner.avatar_url ? (
                  <img src={worker.owner.avatar_url} alt={worker.owner.full_name || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20" />
                )}
              </div>
              <span className="text-sm text-muted-foreground">{worker.owner.full_name}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {worker.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{worker.description}</p>
        )}

        {/* Details */}
        <div className="flex flex-wrap gap-2 text-xs">
          {worker.city && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {worker.city}
            </span>
          )}
          {worker.experience_years && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Star className="w-3 h-3" />
              {worker.experience_years} yrs exp
            </span>
          )}
          {worker.availability && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              {worker.availability.slice(0, 20)}...
            </span>
          )}
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/40">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight leading-none mb-1">Price</span>
            <div className="flex items-baseline gap-1">
              <span className="font-black text-xl tracking-tighter text-foreground font-mono">
                {(worker.price ?? 0) > 0 ? `$${worker.price}` : 'Quote'}
              </span>
              {(worker.price ?? 0) > 0 && pricingInfo && (
                <span className="text-[10px] font-bold text-muted-foreground/80 lowercase">
                  /{pricingInfo.label.replace('Per ', '')}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            <SaveButton 
              targetId={worker.id}
              targetType="listing"
              className="w-11 h-11 rounded-2xl bg-muted/40 border border-border/20 backdrop-blur-md"
              variant="circular"
            />
            <button
              onClick={() => {
                triggerHaptic('light');
                onContact(worker.owner_id);
              }}
              className="group relative flex items-center justify-center gap-2 px-6 h-11 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all active:scale-95 bg-gradient-to-br from-rose-500 via-pink-600 to-orange-500 shadow-xl shadow-rose-500/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-sweep" />
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contact</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});



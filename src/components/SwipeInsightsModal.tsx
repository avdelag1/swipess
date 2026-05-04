import { motion, PanInfo } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Listing } from '@/hooks/useListings';
import { MatchedClientProfile } from '@/hooks/useSmartMatching';
import {
  MapPin, Calendar, CheckCircle, Bed, Bath, Square, Anchor, Bike, Car, Home,
  X, ArrowLeft, ChevronLeft, ChevronRight, Fuel, ShieldCheck, Briefcase,
  Gauge, Ruler, Zap, Wrench, Clock, User, DollarSign,
} from 'lucide-react';
import { PropertyImageGallery } from './PropertyImageGallery';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

interface SwipeInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing?: Listing | null;
  profile?: MatchedClientProfile | null;
}

const CATEGORY_META: Record<string, { icon: React.ReactNode; label: string }> = {
  property: { icon: <Home className="w-4 h-4" />, label: 'Property' },
  yacht: { icon: <Anchor className="w-4 h-4" />, label: 'Yacht' },
  motorcycle: { icon: <Car className="w-4 h-4" />, label: 'Motorcycle' },
  bicycle: { icon: <Bike className="w-4 h-4" />, label: 'Bicycle' },
  vehicle: { icon: <Car className="w-4 h-4" />, label: 'Vehicle' },
  worker: { icon: <Briefcase className="w-4 h-4" />, label: 'Worker' },
  services: { icon: <Briefcase className="w-4 h-4" />, label: 'Service' },
};

export function SwipeInsightsModal({ open, onOpenChange, listing, profile }: SwipeInsightsModalProps) {
  const { isLight } = useAppTheme();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const isClientProfile = !!profile;

  const images: string[] = useMemo(() => {
    if (isClientProfile) return profile?.profile_images || [];
    return listing?.images || [];
  }, [isClientProfile, profile, listing]);

  const handleDragEnd = (_e: any, info: PanInfo) => {
    if (info.offset.y > 60 || info.velocity.y > 350) onOpenChange(false);
  };

  if (!listing && !profile) return null;

  const title = isClientProfile ? profile?.name : listing?.title;
  const category = (listing?.category || 'property').toLowerCase();
  const meta = CATEGORY_META[category] || CATEGORY_META.property;
  const subtitle = isClientProfile
    ? `${profile?.age ? profile.age + ' • ' : ''}${profile?.city || ''}`
    : `${listing?.address || listing?.city || meta.label}`;

  // Build category-specific spec rows
  const specs: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (listing) {
    const l: any = listing;
    if (l.price) {
      const unit = l.listing_type === 'rental' ? (l.rental_duration_type === 'monthly' ? '/mo' : '/day') : '';
      specs.push({ icon: <DollarSign className="w-4 h-4" />, label: 'Price', value: `$${Number(l.price).toLocaleString()}${unit}` });
    }
    if (category === 'property') {
      if (l.beds != null) specs.push({ icon: <Bed className="w-4 h-4" />, label: 'Beds', value: String(l.beds) });
      if (l.baths != null) specs.push({ icon: <Bath className="w-4 h-4" />, label: 'Baths', value: String(l.baths) });
      if (l.square_footage) specs.push({ icon: <Square className="w-4 h-4" />, label: 'Size', value: `${l.square_footage} ft²` });
      if (l.property_type) specs.push({ icon: <Home className="w-4 h-4" />, label: 'Type', value: l.property_type });
      if (l.furnished) specs.push({ icon: <CheckCircle className="w-4 h-4" />, label: 'Furnished', value: 'Yes' });
      if (l.pet_friendly) specs.push({ icon: <CheckCircle className="w-4 h-4" />, label: 'Pet Friendly', value: 'Yes' });
    } else if (category === 'motorcycle' || category === 'vehicle') {
      if (l.brand || l.vehicle_brand) specs.push({ icon: <Car className="w-4 h-4" />, label: 'Brand', value: l.brand || l.vehicle_brand });
      if (l.model || l.vehicle_model) specs.push({ icon: <Wrench className="w-4 h-4" />, label: 'Model', value: l.model || l.vehicle_model });
      if (l.year) specs.push({ icon: <Calendar className="w-4 h-4" />, label: 'Year', value: String(l.year) });
      if (l.mileage != null) specs.push({ icon: <Gauge className="w-4 h-4" />, label: 'Mileage', value: `${l.mileage} km` });
      if (l.engine_cc) specs.push({ icon: <Zap className="w-4 h-4" />, label: 'Engine', value: `${l.engine_cc} cc` });
      if (l.transmission) specs.push({ icon: <Wrench className="w-4 h-4" />, label: 'Trans.', value: l.transmission });
      if (l.fuel_type) specs.push({ icon: <Fuel className="w-4 h-4" />, label: 'Fuel', value: l.fuel_type });
      if (l.color) specs.push({ icon: <CheckCircle className="w-4 h-4" />, label: 'Color', value: l.color });
    } else if (category === 'bicycle') {
      if (l.brand) specs.push({ icon: <Bike className="w-4 h-4" />, label: 'Brand', value: l.brand });
      if (l.model) specs.push({ icon: <Wrench className="w-4 h-4" />, label: 'Model', value: l.model });
      if (l.frame_size) specs.push({ icon: <Ruler className="w-4 h-4" />, label: 'Frame', value: l.frame_size });
      if (l.wheel_size) specs.push({ icon: <Ruler className="w-4 h-4" />, label: 'Wheels', value: l.wheel_size });
      if (l.frame_material) specs.push({ icon: <Wrench className="w-4 h-4" />, label: 'Material', value: l.frame_material });
      if (l.brake_type) specs.push({ icon: <Wrench className="w-4 h-4" />, label: 'Brakes', value: l.brake_type });
      if (l.gear_type) specs.push({ icon: <Wrench className="w-4 h-4" />, label: 'Gears', value: l.gear_type });
      if (l.electric_assist) specs.push({ icon: <Zap className="w-4 h-4" />, label: 'E-Assist', value: 'Yes' });
    } else if (category === 'yacht') {
      if (l.length_m) specs.push({ icon: <Ruler className="w-4 h-4" />, label: 'Length', value: `${l.length_m} m` });
      if (l.berths) specs.push({ icon: <Bed className="w-4 h-4" />, label: 'Berths', value: String(l.berths) });
      if (l.max_passengers) specs.push({ icon: <User className="w-4 h-4" />, label: 'Capacity', value: String(l.max_passengers) });
      if (l.hull_material) specs.push({ icon: <Wrench className="w-4 h-4" />, label: 'Hull', value: l.hull_material });
      if (l.engines) specs.push({ icon: <Zap className="w-4 h-4" />, label: 'Engines', value: l.engines });
      if (l.fuel_type) specs.push({ icon: <Fuel className="w-4 h-4" />, label: 'Fuel', value: l.fuel_type });
    } else if (category === 'worker' || category === 'services') {
      if (l.service_category) specs.push({ icon: <Briefcase className="w-4 h-4" />, label: 'Category', value: l.service_category });
      if (l.experience_years != null) specs.push({ icon: <Clock className="w-4 h-4" />, label: 'Experience', value: `${l.experience_years} yrs` });
      if (l.work_type) specs.push({ icon: <Briefcase className="w-4 h-4" />, label: 'Work Type', value: l.work_type });
      if (l.schedule_type) specs.push({ icon: <Clock className="w-4 h-4" />, label: 'Schedule', value: l.schedule_type });
      if (l.pricing_unit) specs.push({ icon: <DollarSign className="w-4 h-4" />, label: 'Pricing', value: l.pricing_unit });
    }
  } else if (profile) {
    const p: any = profile;
    if (p.age) specs.push({ icon: <User className="w-4 h-4" />, label: 'Age', value: String(p.age) });
    if (p.city) specs.push({ icon: <MapPin className="w-4 h-4" />, label: 'City', value: p.city });
    if (p.occupation) specs.push({ icon: <Briefcase className="w-4 h-4" />, label: 'Work', value: p.occupation });
    if (p.budget_min || p.budget_max) specs.push({
      icon: <DollarSign className="w-4 h-4" />,
      label: 'Budget',
      value: `$${p.budget_min || 0}–$${p.budget_max || '?'}`
    });
    if (p.work_schedule) specs.push({ icon: <Clock className="w-4 h-4" />, label: 'Schedule', value: p.work_schedule });
    if (p.verified) specs.push({ icon: <ShieldCheck className="w-4 h-4" />, label: 'Verified', value: 'Yes' });
  }

  const description = isClientProfile ? (profile as any)?.bio : listing?.description;
  const tags: string[] = isClientProfile
    ? ((profile as any)?.interests || (profile as any)?.lifestyle_tags || [])
    : (listing?.amenities || listing?.equipment || listing?.skills || []) as string[];

  const surface = isLight ? 'bg-white' : 'bg-[#0a0a0a]';
  const textPri = isLight ? 'text-slate-900' : 'text-white';
  const textSec = isLight ? 'text-slate-500' : 'text-white/60';
  const textTer = isLight ? 'text-slate-400' : 'text-white/40';
  const card = isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-white/[0.04] border-white/10';
  const chipBg = isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/[0.06] text-white/80 border-white/10';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className={cn(
          "max-w-[460px] w-[calc(100vw-24px)] p-0 overflow-hidden border-none rounded-[36px] h-[92dvh] max-h-[92dvh] shadow-2xl flex flex-col",
          surface
        )}
      >
        <div className="flex flex-col h-full min-h-0 relative">
          {/* Drag handle */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={handleDragEnd}
            className="shrink-0 flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing z-30"
          >
            <div className={cn("w-12 h-1.5 rounded-full", isLight ? "bg-slate-300" : "bg-white/20")} />
          </motion.div>

          {/* Header bar */}
          <div className="px-5 pb-3 flex items-center justify-between z-30">
            <button
              onClick={() => onOpenChange(false)}
              className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-all",
                isLight ? "bg-slate-900 text-white border border-slate-900 shadow-md" : "bg-white/10 border border-white/20 text-white"
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-2xl backdrop-blur-xl",
              isLight ? "bg-slate-900 text-white border border-slate-900 shadow-md" : "bg-white/10 border border-white/20"
            )}>
              {meta.icon}
              <span className={cn("text-[11px] font-semibold uppercase tracking-wider", isLight ? "text-white" : textPri)}>{meta.label}</span>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-all",
                isLight ? "bg-slate-900 text-white border border-slate-900 shadow-md" : "bg-white/10 border border-white/20 text-white"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide">
            {/* Photo carousel */}
            {images.length > 0 && (
              <div className="relative w-full h-[280px] bg-black">
                <button
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  className="absolute inset-0 w-full h-full"
                >
                  <img
                    src={images[imageIndex]}
                    alt={title || ''}
                    className="w-full h-full object-cover"
                  />
                </button>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setImageIndex(i => (i - 1 + images.length) % images.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setImageIndex(i => (i + 1) % images.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            i === imageIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="px-5 pt-5 pb-8 space-y-6">
              {/* Title */}
              <div className="space-y-1.5">
                <h2 className={cn("text-2xl font-bold tracking-tight leading-tight", textPri)}>{title}</h2>
                {subtitle && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className={cn("w-3.5 h-3.5", textTer)} />
                    <p className={cn("text-sm", textSec)}>{subtitle}</p>
                  </div>
                )}
              </div>

              {/* Specs grid */}
              {specs.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  {specs.map((s, i) => (
                    <div key={i} className={cn("p-3.5 rounded-2xl border flex items-center gap-3", card)}>
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        isLight ? "bg-white text-slate-600 border border-slate-200" : "bg-white/[0.06] text-white/70 border border-white/10"
                      )}>
                        {s.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-[10px] font-semibold uppercase tracking-wider", textTer)}>{s.label}</p>
                        <p className={cn("text-sm font-bold truncate", textPri)}>{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              {description && (
                <div className="space-y-2">
                  <h3 className={cn("text-[11px] font-bold uppercase tracking-[0.15em]", textTer)}>About</h3>
                  <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", textSec)}>{description}</p>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <h3 className={cn("text-[11px] font-bold uppercase tracking-[0.15em]", textTer)}>
                    {isClientProfile ? 'Interests' : (category === 'worker' || category === 'services' ? 'Skills' : (listing?.equipment?.length ? 'Equipment' : 'Amenities'))}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t, i) => (
                      <span key={i} className={cn("px-3 py-1.5 rounded-full text-[12px] font-medium border", chipBg)}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={cn(
            "shrink-0 p-5 pt-3 border-t backdrop-blur-2xl",
            isLight ? "border-slate-200 bg-white/90" : "border-white/5 bg-black/40"
          )}>
            <Button
              onClick={() => onOpenChange(false)}
              className={cn(
                "w-full h-14 rounded-2xl font-bold text-base tracking-wide active:scale-[0.98] transition-all border-0 shadow-lg",
                isLight ? "!bg-slate-900 !text-white hover:!bg-slate-800" : "!bg-white !text-black hover:!bg-white/90"
              )}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>

      {images.length > 0 && (
        <PropertyImageGallery
          images={images}
          alt={title || ''}
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          initialIndex={imageIndex}
        />
      )}
    </Dialog>
  );
}

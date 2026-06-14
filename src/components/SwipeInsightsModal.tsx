import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Listing } from '@/hooks/useListings';
import { MatchedClientProfile } from '@/hooks/useSmartMatching';
import {
  Anchor, ArrowLeft, Bath, Bed, Bike, Briefcase, Calendar, Car, CheckCircle,
  Clock, DollarSign, Eye, Flag, Fuel, Gauge, Home, MapPin, Share2, MessageCircle,
  Ruler, ShieldCheck, Square, User, Wrench, Zap,
} from 'lucide-react';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { PropertyImageGallery } from './PropertyImageGallery';
import { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/utils/haptics';
import { canNativeShare, generateShareUrl, shareViaNavigator, copyToClipboard } from '@/hooks/useSharing';
import { appToast } from '@/utils/appNotification';

interface SwipeInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing?: Listing | null;
  profile?: MatchedClientProfile | null;
  /** Primary action — "Connect" rail button calls this (e.g. start a conversation). */
  onConnect?: () => void;
  /** Share rail button. When omitted, falls back to native share / copy link. */
  onShare?: () => void;
  /** Report rail button. When provided, a Report action appears in the rail. */
  onReport?: () => void;
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

export function SwipeInsightsModal({ open, onOpenChange, listing, profile, onConnect, onShare, onReport }: SwipeInsightsModalProps) {
  const { isLight } = useAppTheme();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const isClientProfile = !!profile;

  const images: string[] = useMemo(() => {
    if (isClientProfile) return profile?.profile_images || [];
    const raw = (listing as any)?.images;
    if (Array.isArray(raw)) {
      return raw.map((i: any) => typeof i === 'string' ? i : i?.url || i?.image_url || i?.src || '').filter(Boolean);
    }
    const single = (listing as any)?.image_url;
    if (single) return [single];
    return [];
  }, [isClientProfile, profile, listing]);

  // On native, let the hero photo draw under the status bar (notch) for a true
  // full-screen feel while the modal is open; revert to the app default on close.
  useEffect(() => {
    if (!open || !Capacitor.isNativePlatform()) return;
    import('@capacitor/status-bar')
      .then(({ StatusBar }) => StatusBar.setOverlaysWebView({ overlay: true }))
      .catch(() => { /* status bar plugin unavailable */ });
    return () => {
      import('@capacitor/status-bar')
        .then(({ StatusBar }) => StatusBar.setOverlaysWebView({ overlay: false }))
        .catch(() => { /* status bar plugin unavailable */ });
    };
  }, [open]);

  const handleClose = () => {
    triggerHaptic('light');
    onOpenChange(false);
  };

  const prevImage = () => {
    triggerHaptic('light');
    setImageIndex(i => (i - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    triggerHaptic('light');
    setImageIndex(i => (i + 1) % images.length);
  };

  const openGallery = () => {
    if (images.length === 0) return;
    triggerHaptic('light');
    setGalleryOpen(true);
  };

  const handleReport = () => {
    triggerHaptic('medium');
    onReport?.();
    onOpenChange(false);
  };

  const handleShareClick = async () => {
    triggerHaptic('light');
    if (onShare) { onShare(); return; }
    const shareTitle = profile?.name || listing?.title || 'Check this out on Swipess';
    const shareUrl = generateShareUrl(
      profile
        ? { profileId: (profile as any)?.user_id || (profile as any)?.id }
        : { listingId: (listing as any)?.id }
    );
    if (canNativeShare()) {
      await shareViaNavigator({ title: shareTitle, text: `Check out ${shareTitle} on Swipess!`, url: shareUrl });
    } else {
      const ok = await copyToClipboard(shareUrl);
      if (ok) appToast.info('Link copied to clipboard');
    }
  };

  const handleConnect = () => {
    triggerHaptic('success');
    onConnect?.();
    onOpenChange(false);
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

  const description = isClientProfile ? (profile as any)?.bio || (profile as any)?.description || '' : listing?.description || (listing as any)?.bio || (listing as any)?.details || '';
  const tags: string[] = isClientProfile
    ? ((profile as any)?.interests || (profile as any)?.lifestyle_tags || [])
    : (listing?.amenities || listing?.equipment || listing?.skills || (listing as any)?.tags || []) as string[];

  const textPri = isLight ? 'text-slate-900' : 'text-white';
  const textSec = isLight ? 'text-slate-700' : 'text-white/60';
  const textTer = isLight ? 'text-slate-600' : 'text-white/40';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className={cn(
          "max-w-[100vw] sm:max-w-md w-full h-[100dvh] max-h-[100dvh] p-0 rounded-none border-none flex flex-col overflow-hidden shadow-2xl",
          isLight ? "bg-white" : "bg-black"
        )}
      >
        <div className="flex flex-col h-full min-h-0 relative">
          
          {/* Scrollable body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide pb-16">

            {/* ── Luxury Card Hero — no gallery, no dots, static image ── */}
            <div className="px-4 pt-4 pb-2 z-10 shrink-0">
              <div className="relative overflow-hidden h-[50vh] min-h-[400px] rounded-[2rem] shadow-2xl border border-white/10 bg-black/50">
                {images.length > 0 ? (
                  <img
                    src={images[0]} // Always just the first image, no gallery
                    alt={title || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-white/40"><Eye className="w-12 h-12" /></div>
                  </div>
                )}
                
                {/* Elegant Gradient Overlay for text/buttons */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                {/* Category badge overlaid bottom-left */}
                <div className="absolute bottom-6 left-5 z-20">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <div className="text-[#ff3366]">{meta.icon}</div>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white">{meta.label}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Content ── */}
            <div className="px-5 mt-2 relative z-10 space-y-8">

              {/* Title + location, below the photo */}
              <div className="space-y-3">
                <h2 className={cn("text-[2.5rem] font-black italic uppercase tracking-tighter leading-[0.9]", textPri)}>
                  {title}
                </h2>
                {subtitle && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#a16b00]/15 border border-[#f5a623]/30">
                    <MapPin className="w-4 h-4 text-[#f5a623]" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f5a623]">{subtitle}</span>
                  </div>
                )}
              </div>

              {/* Chunky Specs Grid */}
              {specs.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                  {specs.map((s, i) => (
                    <div key={i} className={cn("p-6 rounded-[2.5rem] flex items-center gap-5 shadow-sm", isLight ? "bg-slate-100" : "bg-[#161618]")}>
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                        isLight ? "bg-white text-indigo-600" : "bg-[#252528] text-indigo-400"
                      )}>
                        {s.icon}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className={cn("text-[10px] font-black uppercase tracking-[0.25em]", textTer)}>{s.label}</p>
                        <p className={cn("text-[17px] font-black italic tracking-tight uppercase", textPri)}>{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Description styled as "The Experience" */}
              {description && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-4">
                    <h3 className={cn("text-[11px] font-black uppercase tracking-[0.3em]", textTer)}>Overview</h3>
                    <div className={cn("flex-1 h-px", isLight ? "bg-slate-200" : "bg-white/10")} />
                  </div>
                  <p className={cn("text-[16px] italic leading-[1.6] whitespace-pre-wrap font-medium", textSec)}>
                    {description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className={cn("text-[11px] font-black uppercase tracking-[0.3em]", textTer)}>
                    {isClientProfile ? 'Interests' : (category === 'worker' || category === 'services' ? 'Skills' : (listing?.equipment?.length ? 'Equipment' : 'Amenities'))}
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {tags.map((t, i) => (
                      <span key={i} className={cn("px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider", isLight ? "bg-slate-100 text-slate-700" : "bg-[#161618] text-white/80")}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating return button — top-right corner */}
          <div className="absolute top-0 right-0 p-safe pt-safe-top z-50">
            <div className="flex justify-end px-5 pt-4">
              <button
                onClick={handleClose}
                aria-label="Close"
                className="w-11 h-11 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Vertical action rail — same icon-button style as the swipe cards */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-50 pointer-events-auto">
            <div
              className="flex flex-col gap-1.5 p-1.5 rounded-full"
              style={{
                background: 'rgba(24, 24, 28, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.20)',
                boxShadow: '0 8px 32px -6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <GlassIconButton icon={Share2} onClick={handleShareClick} label="Share" tone="onPhoto" size="md" haptic={false} />
              <GlassIconButton icon={MessageCircle} onClick={handleConnect} label="Connect" tone="onPhoto" size="md" haptic={false} />
              {onReport && (
                <GlassIconButton icon={Flag} onClick={handleReport} label="Report" tone="onPhoto" size="md" haptic={false} />
              )}
            </div>
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

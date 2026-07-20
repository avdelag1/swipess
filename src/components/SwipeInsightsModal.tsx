import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Listing } from '@/hooks/useListings';
import { MatchedClientProfile } from '@/hooks/useSmartMatching';
import {
  Anchor, ArrowLeft, Bath, Bed, Bike, Briefcase, Calendar, Car, CheckCircle,
  Clock, DollarSign, Flag, Fuel, Gauge, Home, MapPin, MessageCircle, Ruler,
  Share2, ShieldCheck, Square, User, Wrench, Zap,
} from 'lucide-react';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { PropertyImageGallery } from './PropertyImageGallery';
import { useEffect, useMemo, useState } from 'react';
import { CATEGORY_META } from '@/constants/categories';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/utils/haptics';
import { canNativeShare, copyToClipboard, generateShareUrl, shareViaNavigator } from '@/hooks/useSharing';
import { appToast } from '@/utils/appNotification';
import { AppleLanguage } from '@/lib/plugins/AppleLanguage';
import { logger } from '@/utils/prodLogger';

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
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);

  // Reset translation state when the viewed listing changes
  useEffect(() => {
    setTranslatedDesc(null);
    setIsTranslating(false);
    setDetectedLang(null);
  }, [listing?.id, profile?.id]);

  const isClientProfile = !!profile;

  const images: string[] = useMemo(() => {
    if (isClientProfile) {
      const pImages = profile?.profile_images;
      if (typeof pImages === 'string') {
        try { const parsed = JSON.parse(pImages); if (Array.isArray(parsed)) return parsed; } catch { return [pImages]; }
      }
      return Array.isArray(pImages) ? pImages : [];
    }
    let raw = (listing as any)?.images;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { raw = [raw]; }
    }
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
          "w-full max-w-[100vw] h-[100dvh] max-h-[100dvh] p-0 rounded-none border-none flex flex-col overflow-hidden shadow-2xl",
          isLight ? "bg-white" : "bg-black"
        )}
      >
        <div className="flex flex-col h-full min-h-0 relative">
          
          {/* Scrollable body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide pb-16">

            {/* ── Luxury Card Hero ── */}
            <motion.div 
              layoutId={`hero-${(profile as any)?.user_id || (profile as any)?.id || (listing as any)?.id}-container`}
              className="z-10 shrink-0 relative w-full h-[50vh] min-h-[400px] rounded-b-[2.5rem] overflow-hidden bg-black/50 shadow-2xl"
            >
                {images.length > 0 ? (
                  <>
                    <motion.img
                      layoutId={imageIndex === 0 ? `hero-${(profile as any)?.user_id || (profile as any)?.id || (listing as any)?.id}` : undefined}
                      src={images[imageIndex]}
                      alt={title || ''}
                      className="w-full h-full object-cover"
                    />
                    {images.length > 1 && (
                      <>
                        <div className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer" role="button" aria-label="Previous image" tabIndex={0} onClick={prevImage} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && prevImage()} />
                        <div className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer" role="button" aria-label="Next image" tabIndex={0} onClick={nextImage} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && nextImage()} />
                        <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 z-30 px-4">
                          {images.map((_, idx) => (
                            <div key={idx} className={cn("h-1.5 rounded-full transition-all shadow-[0_1px_2px_rgba(0,0,0,0.5)]", idx === imageIndex ? "bg-white w-4" : "bg-white/40 w-1.5")} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #533483 100%)' }}>
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff3366, #ff6b35)', boxShadow: '0 12px 40px rgba(255, 51, 102, 0.4)' }}>
                        <User className="w-12 h-12 text-white" />
                      </div>
                      <span className="text-white/50 text-[10px] font-black uppercase tracking-[0.3em]">No Photo Available</span>
                    </div>
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
            </motion.div>

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
                <div className="grid grid-cols-2 gap-3">
                  {specs.map((s, i) => {
                    const gradients = [
                      'linear-gradient(135deg, #ff3366, #ff6b35)',
                      'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      'linear-gradient(135deg, #06b6d4, #3b82f6)',
                      'linear-gradient(135deg, #f59e0b, #ef4444)',
                      'linear-gradient(135deg, #10b981, #059669)',
                      'linear-gradient(135deg, #ec4899, #8b5cf6)',
                      'linear-gradient(135deg, #f97316, #eab308)',
                      'linear-gradient(135deg, #14b8a6, #06b6d4)',
                    ];
                    const gradient = gradients[i % gradients.length];
                    return (
                      <div key={i} className={cn("p-4 rounded-[1.8rem] flex flex-col gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border transition-all duration-300", isLight ? "bg-white/70 backdrop-blur-xl border-black/5" : "bg-black/40 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]")}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg" style={{ background: gradient }}>
                          {s.icon}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <p className={cn("text-[9px] font-black uppercase tracking-[0.25em]", textTer)}>{s.label}</p>
                          <p className={cn("text-[15px] font-black italic tracking-tight uppercase leading-tight", textPri)}>{s.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Description styled as "The Experience" */}
              {description && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-4">
                    <h3 className={cn("text-[11px] font-black uppercase tracking-[0.3em]", textTer)}>Overview</h3>
                    <div className={cn("flex-1 h-px", isLight ? "bg-slate-200" : "bg-white/10")} />
                    {/* Native Translation Button */}
                    {Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios' && (
                      <button
                        onClick={async () => {
                          if (translatedDesc) {
                            // Toggle back to original
                            setTranslatedDesc(null);
                            return;
                          }
                          setIsTranslating(true);
                          try {
                            const result = await AppleLanguage.translateText({ text: description });
                            if (result.translatedText && result.translatedText !== description) {
                              setTranslatedDesc(result.translatedText);
                            } else {
                              appToast.info('Already in your language');
                            }
                          } catch (err) {
                            logger.error('Translation failed', err);
                          } finally {
                            setIsTranslating(false);
                          }
                        }}
                        disabled={isTranslating}
                        className={cn(
                          "shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95",
                          translatedDesc
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                        )}
                      >
                        {isTranslating ? '...' : translatedDesc ? 'Original' : 'Translate'}
                      </button>
                    )}
                  </div>
                  <p className={cn("text-[16px] italic leading-[1.6] whitespace-pre-wrap font-medium", textSec)}>
                    {translatedDesc || description}
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
                    {tags.map((t, i) => {
                      const tagColors = [
                        { bg: 'rgba(255,51,102,0.12)', border: 'rgba(255,51,102,0.25)', text: '#ff3366' },
                        { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', text: '#6366f1' },
                        { bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.25)', text: '#06b6d4' },
                        { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: '#f59e0b' },
                        { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: '#10b981' },
                        { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.25)', text: '#ec4899' },
                      ];
                      const color = tagColors[i % tagColors.length];
                      return (
                        <span key={i} className="px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider border" style={{ backgroundColor: color.bg, borderColor: color.border, color: color.text }}>
                          {t}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating return button — top-left corner */}
          <div className="absolute top-0 left-0 p-safe pt-safe-top z-50">
            <div className="flex justify-start px-5 pt-4">
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
                backdropFilter: 'blur(32px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
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

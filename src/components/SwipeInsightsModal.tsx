import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Listing } from '@/hooks/useListings';
import { MatchedClientProfile } from '@/hooks/useSmartMatching';
import { Eye, MapPin, DollarSign, Calendar, Shield, CheckCircle, Star, Bed, Bath, Square, Anchor, Bike, Car, Home, Zap, Clock, TrendingUp, ThumbsUp, Sparkles, Users, Gauge, Ruler, Flame, X, ArrowLeft, ChevronLeft, ChevronRight, Fuel, ShieldCheck, Heart, Share2, Award, Info } from 'lucide-react';
import { PropertyImageGallery } from './PropertyImageGallery';
import { useState, useMemo } from 'react';
import { usePWAMode } from '@/hooks/usePWAMode';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

// Category icons for listings
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  property: <Home className="w-4 h-4" />,
  yacht: <Anchor className="w-4 h-4" />,
  motorcycle: <Car className="w-4 h-4" />,
  bicycle: <Bike className="w-4 h-4" />,
};

interface SwipeInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing?: Listing | null;
  profile?: MatchedClientProfile | null;
}

export function SwipeInsightsModal({ open, onOpenChange, listing, profile }: SwipeInsightsModalProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // PWA Mode - use faster animations for instant opening
  const pwaMode = usePWAMode();

  // Handle swipe-to-close gesture
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    // Close if dragged down
    if (info.offset.y > 50 || info.velocity.y > 300) {
      onOpenChange(false);
    }
  };

  // Determine if we're showing client profile or property listing insights
  const isClientProfile = !!profile;

  // Get images for gallery
  const images = isClientProfile
    ? (profile?.profile_images || [])
    : (listing?.images || []);

  const insights = useMemo(() => {
    if (isClientProfile && profile) {
      const interestCount = (profile.interests?.length || 0);
      const photoCount = profile.profile_images?.length || 0;
      const completeness = photoCount ? 100 : 60;

      let readinessScore = 0;
      if (profile.name) readinessScore += 15;
      if (profile.age) readinessScore += 10;
      if (photoCount > 0) readinessScore += 20;
      if (photoCount >= 3) readinessScore += 10;
      if (interestCount >= 3) readinessScore += 15;
      if (interestCount >= 6) readinessScore += 10;
      if (profile.verified) readinessScore += 20;

      return {
        views: Math.max(10, Math.round(completeness * 5)),
        saves: Math.max(2, Math.round(interestCount * 0.5)),
        shares: Math.max(1, Math.round(interestCount * 0.3)),
        responseRate: completeness >= 80 ? 85 : 60,
        avgResponseTime: 2,
        popularityScore: Math.min(10, Math.round(3 + photoCount)),
        viewsLastWeek: Math.max(5, Math.round(completeness * 2)),
        demandLevel: photoCount > 3 ? 'high' : 'medium',
        priceVsMarket: 0,
        readinessScore: Math.min(100, readinessScore),
        photoCount,
        interestCount,
      };
    } else if (listing) {
      const amenityCount = (listing.amenities?.length || 0);
      const imageCount = (listing.images?.length || 0);
      const equipmentCount = (listing.equipment?.length || 0);
      const completeness = imageCount * 20 + (amenityCount * 2) + (equipmentCount * 2);
      const category = listing.category || 'property';
      const isVehicle = ['yacht', 'motorcycle', 'bicycle'].includes(category);

      let qualityScore = 0;
      if (imageCount >= 5) qualityScore += 25;
      else if (imageCount >= 3) qualityScore += 15;
      if (amenityCount >= 5) qualityScore += 20;
      if (listing.furnished) qualityScore += 10;
      if (listing.pet_friendly) qualityScore += 10;
      if (isVehicle && equipmentCount >= 3) qualityScore += 15;

      return {
        views: Math.max(25, Math.round(completeness * 8)),
        saves: Math.max(8, Math.round(amenityCount * 1.5)),
        shares: Math.max(3, Math.round(imageCount * 0.8)),
        responseRate: Math.min(98, 75 + amenityCount * 2),
        avgResponseTime: amenityCount > 5 ? 1 : 4,
        popularityScore: Math.min(10, Math.round(imageCount + (amenityCount / 2))),
        viewsLastWeek: Math.max(12, Math.round(completeness * 3)),
        demandLevel: qualityScore >= 70 ? 'high' : qualityScore >= 40 ? 'medium' : 'low',
        priceVsMarket: -5,
        qualityScore: Math.min(100, qualityScore),
        isVehicle,
        category,
      };
    }
    return null;
  }, [isClientProfile, profile, listing]);

  if (!listing && !profile) return null;

  const title = isClientProfile ? profile?.name : listing?.title;
  const subtitle = isClientProfile 
    ? `${profile?.age ? profile.age + ' • ' : ''}${profile?.roommate_available ? 'Looking for Roommate' : 'Prospective Renter'}`
    : `${listing?.address || listing?.category || 'Premium Listing'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton
        className="max-w-[440px] p-0 overflow-hidden bg-black border-none rounded-[40px] h-[92dvh] shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
      >
        {/* 🛸 NEXUS ATMOSPHERE */}
        <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[100%] h-[100%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex flex-col h-full relative z-10">
          {/* Draggable handle for swipe-to-close */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={handleDragEnd}
            className="shrink-0 flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          >
            <div className="w-12 h-1.5 rounded-full bg-white/20 shadow-inner" />
          </motion.div>

          {/* Header Area */}
          <div className="px-6 pb-6 pt-2">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => onOpenChange(false)}
                className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-90"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                 <Zap className="w-4 h-4 text-rose-500 fill-current" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white">Nexus Insights</span>
              </div>
              <button 
                onClick={() => onOpenChange(false)}
                className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-tight truncate">{title}</h2>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest truncate">{subtitle}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-6 scrollbar-hide">
            {/* 💎 HERO STATS GRID */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-5 rounded-[28px] bg-white/5 border border-white/10 backdrop-blur-xl group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/20">
                    <Eye className="w-4 h-4 text-rose-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Views</span>
                </div>
                <div className="text-3xl font-black text-white">{insights?.views.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-2 text-rose-400">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase">+{insights?.viewsLastWeek} weekly</span>
                </div>
              </div>

              <div className="p-5 rounded-[28px] bg-white/5 border border-white/10 backdrop-blur-xl group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/20">
                    <Zap className="w-4 h-4 text-violet-400 fill-current" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Quality</span>
                </div>
                <div className="text-3xl font-black text-white">{insights?.popularityScore}/10</div>
                <div className="flex items-center gap-1 mt-2 text-violet-400">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase">Elite Status</span>
                </div>
              </div>
            </div>

            {/* 📊 PERFORMANCE ANALYTICS */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Nexus Analytics</h3>
              
              <div className="space-y-3">
                <div className="p-5 rounded-[28px] bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -translate-y-8 translate-x-8" />
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                         <ShieldCheck className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Response Rate</p>
                        <p className="text-lg font-black text-white uppercase tracking-tight">Highly Reliable</p>
                      </div>
                    </div>
                    <div className="text-2xl font-black text-rose-500">{insights?.responseRate}%</div>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${insights?.responseRate}%` }}
                      className="h-full bg-gradient-to-r from-rose-500 to-violet-600 rounded-full"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-[28px] bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                         <Clock className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Average Response</p>
                        <p className="text-lg font-black text-white uppercase tracking-tight">Ultra Fast</p>
                      </div>
                    </div>
                    <div className="text-sm font-black text-violet-400 uppercase tracking-widest">&lt; {insights?.avgResponseTime}H</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 🎯 MARKET POSITIONING */}
            <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Market Sentiment</h3>
               <div className={cn(
                 "p-6 rounded-[32px] border backdrop-blur-3xl relative overflow-hidden",
                 insights?.demandLevel === 'high' 
                   ? "bg-rose-500/10 border-rose-500/20" 
                   : "bg-white/5 border-white/10"
               )}>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-20 translate-x-10" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl">
                      {insights?.demandLevel === 'high' ? <Flame className="w-6 h-6 fill-current" /> : <TrendingUp className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-1.5">Demand Level</p>
                      <p className="text-xl font-black text-white uppercase tracking-tight">{insights?.demandLevel === 'high' ? 'Explosive Interest' : 'Steady Growth'}</p>
                    </div>
                  </div>
                  <p className="text-[12px] text-white/40 font-bold leading-relaxed uppercase tracking-wide">
                    {insights?.demandLevel === 'high' 
                      ? 'This listing is generating significantly more interest than average. Immediate action recommended.' 
                      : 'Consistent engagement levels observed. This listing maintains a strong competitive position.'}
                  </p>
               </div>
            </div>

            {/* 📦 CONTENT DETAILS */}
            <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Configuration</h3>
               <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-[24px] bg-white/5 border border-white/10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                       <Award className="w-4 h-4 text-white/60" />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Rank</p>
                       <p className="text-sm font-black text-white uppercase">Top 1%</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-[24px] bg-white/5 border border-white/10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                       <Info className="w-4 h-4 text-white/60" />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Health</p>
                       <p className="text-sm font-black text-white uppercase">Optimal</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Action Dock */}
          <div className="shrink-0 p-6 pt-4 border-t border-white/5 bg-black/40 backdrop-blur-2xl rounded-b-[40px]">
             <Button 
               onClick={() => onOpenChange(false)}
               className="w-full h-16 rounded-[24px] bg-white text-black hover:bg-white/90 font-black text-base uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all"
             >
               Dismiss Insights
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

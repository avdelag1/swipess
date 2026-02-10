import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Listing } from '@/hooks/useListings';
import { MatchedClientProfile } from '@/hooks/useSmartMatching';
import { Eye, MapPin, DollarSign, Calendar, Shield, CheckCircle, Star, Bed, Bath, Square, Anchor, Bike, Car, Home, Zap, Clock, MessageCircle, TrendingUp, Heart, Sparkles, Users, Gauge, Ruler, ThumbsUp, Flame } from 'lucide-react';
import { PropertyImageGallery } from './PropertyImageGallery';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { usePWAMode } from '@/hooks/usePWAMode';

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

    // Close if dragged down (more responsive threshold for better UX)
    // Triggers on: 50px+ down OR 300+ velocity OR momentum downward
    if (info.offset.y > 50 || info.velocity.y > 300 || (info.velocity.y > 100 && info.offset.y > 20)) {
      onOpenChange(false);
    }
  };

  // Determine if we're showing client profile or property listing insights
  const isClientProfile = !!profile;

  // Get images for gallery
  const images = isClientProfile
    ? (profile?.profile_images || [])
    : (listing?.images || []);

  // Calculate insights data based on actual profile/listing data
  // Note: useMemo must be called unconditionally before any early returns (Rules of Hooks)
  const insights = useMemo(() => {
    if (isClientProfile && profile) {
      // For client profiles: calculate based on profile completeness
      const interestCount = (profile.interests?.length || 0);
      const photoCount = profile.profile_images?.length || 0;
      const completeness = photoCount ? 100 : 60;

      // Calculate readiness score
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
        avgResponseTime: 2, // hours
        popularityScore: Math.min(10, Math.round(3 + photoCount)),
        viewsLastWeek: Math.max(5, Math.round(completeness * 2)),
        demandLevel: photoCount > 3 ? 'high' : 'medium',
        priceVsMarket: 0,
        readinessScore: Math.min(100, readinessScore),
        photoCount,
        interestCount,
      };
    } else if (listing) {
      // For property listings: calculate based on listing completeness
      const amenityCount = (listing.amenities?.length || 0);
      const imageCount = (listing.images?.length || 0);
      const equipmentCount = (listing.equipment?.length || 0);
      const completeness = imageCount * 20 + (amenityCount * 2) + (equipmentCount * 2);
      const category = listing.category || 'property';
      const isVehicle = ['yacht', 'motorcycle', 'bicycle'].includes(category);

      // Calculate quality score
      let qualityScore = 0;
      if (imageCount >= 5) qualityScore += 25;
      else if (imageCount >= 3) qualityScore += 15;
      if (amenityCount >= 5) qualityScore += 20;
      if (listing.furnished) qualityScore += 10;
      if (listing.pet_friendly) qualityScore += 10;
      if (listing.year) qualityScore += 5;
      if (listing.condition === 'excellent') qualityScore += 10;

      return {
        views: Math.max(20, Math.round(completeness * 0.5)),
        saves: Math.max(3, Math.round(amenityCount * 0.5)),
        shares: Math.max(1, Math.round(amenityCount * 0.2)),
        responseRate: 75,
        avgResponseTime: 1, // hours
        popularityScore: Math.min(10, Math.round(5 + Math.round(imageCount * 0.5))),
        viewsLastWeek: Math.max(10, Math.round(completeness * 0.3)),
        demandLevel: (amenityCount + equipmentCount) > 5 ? 'high' : 'medium',
        priceVsMarket: 0,
        qualityScore: Math.min(100, qualityScore),
        category,
        isVehicle,
        amenityCount,
        equipmentCount,
        imageCount,
        isHotListing: qualityScore >= 70 && listing.status === 'available',
      };
    }

    return {
      views: 0,
      saves: 0,
      shares: 0,
      responseRate: 0,
      avgResponseTime: 0,
      popularityScore: 0,
      viewsLastWeek: 0,
      demandLevel: 'medium',
      priceVsMarket: 0,
      qualityScore: 0,
      readinessScore: 0,
    };
  }, [isClientProfile, profile, listing]);

  // Early return if no data (placed after hooks per Rules of Hooks)
  if (!listing && !profile) return null;

  return (
    <AnimatePresence mode="wait">
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <motion.div
            // PWA MODE: Instant opening - skip initial animation, use faster spring
            initial={pwaMode.isPWA ? { opacity: 1, y: 0 } : { opacity: 0, y: '25%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={pwaMode.isPWA ? { opacity: 0 } : { opacity: 0, y: '25%' }}
            transition={{
              type: 'spring',
              damping: pwaMode.isPWA ? pwaMode.springDamping + 10 : 30,
              stiffness: pwaMode.isPWA ? pwaMode.springStiffness + 200 : 600,
              mass: pwaMode.isPWA ? pwaMode.springMass : 0.3,
              // PWA: Near-instant open
              duration: pwaMode.isPWA ? 0.1 : undefined,
            }}
            drag={pwaMode.isPWA ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className="will-change-transform"
            style={{
              transform: 'translateZ(0)',
            }}
          >
            <DialogContent className={`w-[calc(100%-16px)] max-w-[400px] sm:max-w-lg max-h-[70vh] overflow-y-auto overflow-x-hidden transition-opacity duration-75 p-0 ${isDragging ? 'opacity-90' : ''}`}>
              <div className="px-3 sm:px-4 py-3 sm:py-4 w-full max-w-full overflow-x-hidden">
              <DialogHeader className="mb-2 sm:mb-3">
                <DialogTitle className="text-sm sm:text-lg font-bold flex items-center gap-2">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {isClientProfile ? 'Renter Insights' : 'Property Insights'}
                </DialogTitle>
              </DialogHeader>

              {isClientProfile && profile ? (
                // RENTER/CLIENT PROFILE INSIGHTS - Photos First Design
                <div className="space-y-4 sm:space-y-5">
                  {/* Profile Photos - FIRST - Most Important */}
                  {profile.profile_images && profile.profile_images.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary" />
                        Photos ({profile.profile_images.length})
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {profile.profile_images.slice(0, 6).map((image, index) => (
                          <button
                            key={`profile-img-top-${image}-${index}`}
                            onClick={() => {
                              setSelectedImageIndex(index);
                              setGalleryOpen(true);
                            }}
                            className="relative aspect-square rounded-xl overflow-hidden hover:opacity-90 active:scale-[0.98] transition-all shadow-md group"
                          >
                            <img
                              src={image}
                              alt={`${profile.name} photo ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading={index < 3 ? "eager" : "lazy"}
                              decoding="async"
                              fetchPriority={index === 0 ? "high" : "auto"}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            {index === 0 && (
                              <div className="absolute top-1.5 left-1.5 bg-primary/90 text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                                Main
                              </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                              {index + 1}
                            </div>
                          </button>
                        ))}
                      </div>
                      {profile.profile_images.length > 6 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{profile.profile_images.length - 6} more photos
                        </p>
                      )}
                      <p className="text-xs text-primary text-center">Tap any photo to view full size</p>
                    </motion.div>
                  )}

                  {/* Hero Profile Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-500/20 via-orange-500/15 to-amber-500/10 p-3 sm:p-5 border border-red-500/30 backdrop-blur-sm shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/25 to-transparent rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-500/20 to-transparent rounded-full blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        {/* Small Avatar */}
                        {profile.avatar_url && (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-background shrink-0">
                            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-xl font-bold truncate">{profile.name}</h3>
                            {profile.verified && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{profile.city || 'Location flexible'}</span>
                            {profile.age && <span>• {profile.age} yrs</span>}
                          </div>
                        </div>
                      </div>

                      {/* Budget Badge */}
                      {profile.budget_max && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/30 to-emerald-500/20 rounded-full border border-green-500/30 backdrop-blur-sm shadow-md"
                        >
                          <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="font-bold text-green-600 dark:text-green-400">
                            ${profile.budget_max.toLocaleString()}/mo
                          </span>
                          <span className="text-xs text-muted-foreground">budget</span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* Readiness Score Bar */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-gradient-to-br from-red-500/15 to-orange-500/10 rounded-xl border border-red-500/30 backdrop-blur-sm shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        Renter Readiness
                      </span>
                      <Badge className={`${
                        insights.readinessScore >= 80 ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/20 text-green-700 dark:text-green-400 border-green-500/40' :
                        insights.readinessScore >= 60 ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40' :
                        insights.readinessScore >= 40 ? 'bg-gradient-to-r from-yellow-500/30 to-amber-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/40' :
                        'bg-gradient-to-r from-gray-500/30 to-gray-400/20 text-gray-700 dark:text-gray-400 border-gray-500/40'
                      } font-bold shadow-sm`}>
                        {insights.readinessScore}%
                      </Badge>
                    </div>
                    <div className="w-full bg-muted/40 rounded-full h-3 mb-2 shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${insights.readinessScore}%` }}
                        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                        className={`h-3 rounded-full transition-all duration-500 shadow-md ${
                          insights.readinessScore >= 80 ? 'bg-gradient-to-r from-green-500 via-green-400 to-emerald-500' :
                          insights.readinessScore >= 60 ? 'bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-500' :
                          insights.readinessScore >= 40 ? 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-amber-500' :
                          'bg-gradient-to-r from-gray-400 via-gray-300 to-gray-500'
                        }`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {insights.readinessScore >= 80
                        ? '🎉 Highly prepared - Ready to move!'
                        : insights.readinessScore >= 60
                        ? '✨ Well-prepared with detailed preferences'
                        : insights.readinessScore >= 40
                        ? '📝 Moderately prepared'
                        : '🆕 New to the platform'}
                    </p>
                  </motion.div>

                  {/* Quick Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-center p-2 sm:p-3 bg-gradient-to-br from-yellow-500/15 to-amber-500/10 rounded-lg sm:rounded-xl border border-yellow-500/30 shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm"
                    >
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-yellow-600 mb-0.5 sm:mb-1 drop-shadow-md" />
                      <div className="text-xs sm:text-sm font-bold text-yellow-600 dark:text-yellow-400">{insights.readinessScore}%</div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">Score</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center p-2 sm:p-3 bg-gradient-to-br from-blue-500/15 to-cyan-500/10 rounded-lg sm:rounded-xl border border-blue-500/30 shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm"
                    >
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-blue-600 mb-0.5 sm:mb-1 drop-shadow-md" />
                      <div className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">2-4h</div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">Response</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="text-center p-2 sm:p-3 bg-gradient-to-br from-green-500/15 to-emerald-500/10 rounded-lg sm:rounded-xl border border-green-500/30 shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm"
                    >
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-green-600 mb-0.5 sm:mb-1 drop-shadow-md" />
                      <div className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">{insights.photoCount}</div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">Photos</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-center p-2 sm:p-3 bg-gradient-to-br from-red-500/15 to-pink-500/10 rounded-lg sm:rounded-xl border border-red-500/30 shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm"
                    >
                      <Flame className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-red-600 mb-0.5 sm:mb-1 drop-shadow-md" />
                      <div className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">{insights.interestCount}</div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">Interests</div>
                    </motion.div>
                  </div>

                  {/* What They're Looking For */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                      <Home className="w-4 h-4 text-primary" />
                      Looking For
                    </h4>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-1.5 sm:gap-2">
                      {profile.interests?.some(i => i.toLowerCase().includes('long-term') || i.toLowerCase().includes('rent')) && (
                        <div className="flex items-center gap-2 p-2.5 bg-green-500/10 rounded-lg border border-green-500/20">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Long-term Rental</span>
                        </div>
                      )}
                      {profile.interests?.some(i => i.toLowerCase().includes('short-term')) && (
                        <div className="flex items-center gap-2 p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">Short-term Stay</span>
                        </div>
                      )}
                      {profile.interests?.some(i => i.toLowerCase().includes('pet')) && (
                        <div className="flex items-center gap-2 p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                          <span className="text-base">🐾</span>
                          <span className="text-sm">Has Pet(s)</span>
                        </div>
                      )}
                      {profile.interests?.some(i => i.toLowerCase().includes('furnished') || i.toLowerCase().includes('corporate')) && (
                        <div className="flex items-center gap-2 p-2.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                          <Sparkles className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm">Prefers Furnished</span>
                        </div>
                      )}
                      {profile.interests?.some(i => i.toLowerCase().includes('digital nomad') || i.toLowerCase().includes('remote')) && (
                        <div className="flex items-center gap-2 p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                          <Zap className="w-4 h-4 text-cyan-600" />
                          <span className="text-sm">Digital Nomad</span>
                        </div>
                      )}
                      {profile.interests?.some(i => i.toLowerCase().includes('family')) && (
                        <div className="flex items-center gap-2 p-2.5 bg-pink-500/10 rounded-lg border border-pink-500/20">
                          <Users className="w-4 h-4 text-pink-600" />
                          <span className="text-sm">Family Housing</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interests & Lifestyle */}
                  {profile.interests && profile.interests.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <span className="text-lg">✨</span> Interests & Lifestyle
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.slice(0, 10).map((interest) => (
                          <Badge key={`interest-${interest}`} variant="secondary" className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 border-primary/20 transition-colors">
                            {interest}
                          </Badge>
                        ))}
                        {profile.interests.length > 10 && (
                          <Badge variant="outline" className="px-3 py-1.5 text-xs">
                            +{profile.interests.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Verification Badges */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      Verification Status
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                        profile.verified
                          ? 'bg-green-500/15 border-green-500/30'
                          : 'bg-muted/30 border-muted'
                      }`}>
                        <CheckCircle className={`w-3.5 h-3.5 ${profile.verified ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className={`text-xs font-medium ${profile.verified ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          ID {profile.verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                        insights.photoCount >= 2
                          ? 'bg-blue-500/15 border-blue-500/30'
                          : 'bg-muted/30 border-muted'
                      }`}>
                        <Eye className={`w-3.5 h-3.5 ${insights.photoCount >= 2 ? 'text-blue-500' : 'text-muted-foreground'}`} />
                        <span className={`text-xs font-medium ${insights.photoCount >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                          {insights.photoCount} Photos
                        </span>
                      </div>
                      {insights.readinessScore >= 70 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 rounded-full border border-red-500/30">
                          <Star className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">Top Renter</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Match Reasons - Compact */}
                  {profile.matchReasons && profile.matchReasons.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/5 rounded-xl border border-green-500/20">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4 text-green-500" />
                        Why They're a Great Match
                      </h4>
                      <div className="space-y-2">
                        {profile.matchReasons.slice(0, 4).map((reason) => (
                          <div key={`reason-${reason}`} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Profile Highlights */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 bg-gradient-to-r from-red-500/15 via-orange-500/10 to-amber-500/5 rounded-xl border border-red-500/30 shadow-lg backdrop-blur-sm"
                  >
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                      Profile Highlights
                    </h4>
                    <div className="space-y-2">
                      {insights.photoCount >= 3 && (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Multiple photos uploaded ({insights.photoCount})</span>
                        </div>
                      )}
                      {insights.interestCount >= 5 && (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Clear preferences defined ({insights.interestCount} interests)</span>
                        </div>
                      )}
                      {profile.verified && (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Identity verified - Trustworthy renter</span>
                        </div>
                      )}
                      {insights.readinessScore >= 60 && (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Complete profile - Ready to rent</span>
                        </div>
                      )}
                      {profile.budget_max && (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Budget clearly defined: ${profile.budget_max.toLocaleString()}/mo</span>
                        </div>
                      )}
                    </div>
                  </motion.div>

                </div>
              ) : listing ? (
                // PROPERTY LISTING INSIGHTS - Enhanced version
                <div className="mt-4 space-y-5">
                  {/* Hot Listing Alert */}
                  {insights.isHotListing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="p-3 bg-gradient-to-r from-red-500/20 to-orange-500/15 rounded-xl border border-red-500/40 flex items-center gap-3 shadow-lg backdrop-blur-sm"
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                        className="w-8 h-8 bg-red-500/30 rounded-full flex items-center justify-center shadow-md"
                      >
                        <Zap className="w-4 h-4 text-red-500 drop-shadow-md" />
                      </motion.div>
                      <div>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">🔥 Hot Listing!</p>
                        <p className="text-xs text-muted-foreground font-medium">High quality - Act fast</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Property Title & Location with Category */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-lg sm:text-xl font-bold flex-1 break-words">{listing.title}</h3>
                      <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                        {insights.category && CATEGORY_ICONS[insights.category] && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            {CATEGORY_ICONS[insights.category]}
                            <span className="capitalize">{insights.category}</span>
                          </Badge>
                        )}
                        {listing.listing_type && (
                          <Badge variant={listing.listing_type === 'buy' ? 'default' : 'secondary'} className="text-xs">
                            {listing.listing_type === 'buy' ? 'Sale' : 'Rent'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="break-words">{[listing.neighborhood, listing.city].filter(Boolean).join(', ') || 'Location available'}</span>
                    </div>
                    {listing.created_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Listed {getTimeAgo(new Date(listing.created_at))}
                      </p>
                    )}
                  </div>

                  {/* Quick Stats Row */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-center p-2 sm:p-3 bg-gradient-to-br from-green-500/15 to-emerald-500/10 rounded-xl border border-green-500/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm hover:scale-105"
                    >
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-green-600 mb-1 drop-shadow-md" />
                      <div className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400 break-all">${listing.price?.toLocaleString()}</div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">{listing.listing_type === 'buy' ? 'price' : '/month'}</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-center p-2 sm:p-3 bg-gradient-to-br from-purple-500/15 to-pink-500/10 rounded-xl border border-purple-500/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm hover:scale-105"
                    >
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-purple-600 mb-1 drop-shadow-md" />
                      <div className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400">{insights.qualityScore || 75}%</div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">Quality</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center p-2 sm:p-3 bg-gradient-to-br from-blue-500/15 to-cyan-500/10 rounded-xl border border-blue-500/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm hover:scale-105"
                    >
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-blue-600 mb-1 drop-shadow-md" />
                      <div className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">&lt;2h</div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">Response</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="text-center p-2 sm:p-3 bg-gradient-to-br from-yellow-500/15 to-amber-500/10 rounded-xl border border-yellow-500/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm hover:scale-105"
                    >
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-yellow-600 mb-1 drop-shadow-md" />
                      <div className="text-xs sm:text-sm font-bold text-yellow-600 dark:text-yellow-400">{insights.saves}</div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">Interested</div>
                    </motion.div>
                  </div>

                  {/* Key Details Grid - Adaptive for category */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* Property-specific details */}
                    {!insights.isVehicle && (
                      <>
                        {listing.beds && (
                          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                            <Bed className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-bold truncate">{listing.beds}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Bedrooms</div>
                            </div>
                          </div>
                        )}
                        {listing.baths && (
                          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                            <Bath className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-bold truncate">{listing.baths}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Bathrooms</div>
                            </div>
                          </div>
                        )}
                        {listing.square_footage && (
                          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                            <Square className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-bold truncate">{listing.square_footage}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Sq Ft</div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {/* Yacht-specific */}
                    {insights.category === 'yacht' && (
                      <>
                        {listing.length_m && (
                          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                            <Ruler className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-bold truncate">{listing.length_m}m</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Length</div>
                            </div>
                          </div>
                        )}
                        {listing.max_passengers && (
                          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-bold truncate">{listing.max_passengers}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Passengers</div>
                            </div>
                          </div>
                        )}
                        {listing.berths && (
                          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                            <Bed className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-bold truncate">{listing.berths}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Berths</div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {/* Motorcycle-specific */}
                    {insights.category === 'motorcycle' && (
                      <>
                        {listing.engine_cc && (
                          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                            <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-bold truncate">{listing.engine_cc}cc</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Engine</div>
                            </div>
                          </div>
                        )}
                        {listing.year && (
                          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-bold truncate">{listing.year}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Year</div>
                            </div>
                          </div>
                        )}
                        {listing.mileage && (
                          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-bold truncate">{listing.mileage.toLocaleString()}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Miles</div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {/* Bicycle-specific */}
                    {insights.category === 'bicycle' && (
                      <>
                        {listing.frame_size && (
                          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                            <Ruler className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-bold truncate">{listing.frame_size}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Frame</div>
                            </div>
                          </div>
                        )}
                        {listing.electric_assist && (
                          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-bold">E-Bike</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Electric</div>
                            </div>
                          </div>
                        )}
                        {listing.battery_range && (
                          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-bold truncate">{listing.battery_range}km</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">Range</div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Key Features Badges */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {listing.property_type && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Home className="w-3 h-3 shrink-0" />
                        <span className="break-all">{listing.property_type}</span>
                      </Badge>
                    )}
                    {listing.vehicle_type && (
                      <Badge variant="secondary" className="text-xs break-all">{listing.vehicle_type}</Badge>
                    )}
                    {listing.furnished && (
                      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1 text-xs">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        Furnished
                      </Badge>
                    )}
                    {listing.pet_friendly && (
                      <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">
                        🐾 Pet Friendly
                      </Badge>
                    )}
                    {listing.electric_assist && (
                      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1 text-xs">
                        <Zap className="w-3 h-3 shrink-0" />
                        Electric
                      </Badge>
                    )}
                    {listing.condition && (
                      <Badge variant="outline" className="capitalize text-xs break-all">{listing.condition}</Badge>
                    )}
                    {listing.brand && listing.model && (
                      <Badge variant="outline" className="text-xs"><span className="break-all">{listing.brand} {listing.model}</span></Badge>
                    )}
                  </div>

                  {/* Amenities / Equipment */}
                  {((listing.amenities && listing.amenities.length > 0) || (listing.equipment && listing.equipment.length > 0)) && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                        <span className="break-words">{insights.isVehicle ? 'Equipment & Features' : 'Amenities Included'}</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[...(listing.amenities || []), ...(listing.equipment || [])].slice(0, 8).map((item) => (
                          <div key={`amenity-${item}`} className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm capitalize break-words">{item}</span>
                          </div>
                        ))}
                        {([...(listing.amenities || []), ...(listing.equipment || [])].length > 8) && (
                          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg col-span-1 sm:col-span-2">
                            <span className="text-xs sm:text-sm text-primary font-medium">
                              +{[...(listing.amenities || []), ...(listing.equipment || [])].length - 8} more features
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Property Images - Horizontal scroll */}
                  {listing.images && listing.images.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary" />
                        Photos ({listing.images.length})
                      </h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory scrollbar-hide">
                        {listing.images.map((image, index) => (
                          <button
                            key={`listing-img-${image}-${index}`}
                            onClick={() => {
                              setSelectedImageIndex(index);
                              setGalleryOpen(true);
                            }}
                            className="relative flex-shrink-0 w-48 aspect-[4/3] rounded-xl overflow-hidden hover:opacity-90 active:scale-[0.98] transition-all snap-start shadow-lg"
                          >
                            <img
                              src={image}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading={index < 2 ? "eager" : "lazy"}
                              decoding="async"
                              fetchPriority={index === 0 ? "high" : "auto"}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute bottom-2 left-2 text-white text-xs font-medium">
                              {index + 1}/{listing.images.length}
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground text-center">← Swipe to see more • Tap to zoom</p>
                    </div>
                  )}

                  {/* Availability Indicator */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      Availability
                    </h4>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${listing.status === 'available' ? 'bg-green-500 animate-pulse' : listing.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {listing.status === 'available' ? 'Currently Available' :
                             listing.status === 'pending' ? 'Application Pending' :
                             listing.status === 'rented' ? 'Currently Rented' : listing.status || 'Available'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {listing.updated_at
                              ? `Last updated ${getTimeAgo(new Date(listing.updated_at))}`
                              : listing.created_at
                                ? `Listed ${getTimeAgo(new Date(listing.created_at))}`
                                : 'Recently listed'}
                          </p>
                        </div>
                        {listing.status === 'available' && (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Ready</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Why This Listing */}
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl border border-primary/20">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-primary" />
                      Why This Listing
                    </h4>
                    <div className="space-y-2">
                      {listing.images && listing.images.length >= 3 && (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Well-documented with {listing.images.length} photos</span>
                        </div>
                      )}
                      {((listing.amenities?.length || 0) + (listing.equipment?.length || 0)) >= 5 && (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Feature-rich with {(listing.amenities?.length || 0) + (listing.equipment?.length || 0)}+ amenities</span>
                        </div>
                      )}
                      {listing.status === 'available' && (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Available now - Ready for viewing</span>
                        </div>
                      )}
                      {listing.furnished && (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Move-in ready - Fully furnished</span>
                        </div>
                      )}
                    </div>
                  </div>
              </div>
              ) : null}
            </div>
          </DialogContent>

          {/* Full Screen Image Gallery */}
          {images.length > 0 && (
            <PropertyImageGallery
              images={images}
              alt={isClientProfile ? profile?.name || 'Profile' : listing?.title || 'Property'}
              isOpen={galleryOpen}
              onClose={() => setGalleryOpen(false)}
              initialIndex={selectedImageIndex}
            />
          )}
            </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="p-3 bg-muted/50 rounded-xl text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
}

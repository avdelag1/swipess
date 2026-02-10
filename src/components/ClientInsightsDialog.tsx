
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, User, Calendar, Flame, Star, MessageCircle, Eye, Award, TrendingUp, ThumbsUp, Shield, CheckCircle, Clock, Sparkles, Home, Zap, Heart, DollarSign, Users, AlertCircle, Target, Briefcase, Coffee, Bike, Car, Anchor, PawPrint } from 'lucide-react';
import { ClientProfile } from '@/hooks/useClientProfiles';
import { PropertyImageGallery } from './PropertyImageGallery';
import { useNavigate } from 'react-router-dom';
import { useStartConversation } from '@/hooks/useConversations';
import { toast } from '@/hooks/use-toast';
import { useState, memo, useMemo, useCallback } from 'react';
import { logger } from '@/utils/prodLogger';
import { motion } from 'framer-motion';

// Interest category icons for visual display
const INTEREST_ICONS: Record<string, React.ReactNode> = {
  'pet': <PawPrint className="w-3.5 h-3.5" />,
  'digital nomad': <Zap className="w-3.5 h-3.5" />,
  'remote': <Zap className="w-3.5 h-3.5" />,
  'family': <Users className="w-3.5 h-3.5" />,
  'work': <Briefcase className="w-3.5 h-3.5" />,
  'coffee': <Coffee className="w-3.5 h-3.5" />,
  'bicycle': <Bike className="w-3.5 h-3.5" />,
  'bike': <Bike className="w-3.5 h-3.5" />,
  'motorcycle': <Car className="w-3.5 h-3.5" />,
  'yacht': <Anchor className="w-3.5 h-3.5" />,
  'boat': <Anchor className="w-3.5 h-3.5" />,
};

// Tag categories for organized display
const PROPERTY_TAGS = [
  'Looking to rent long-term', 'Short-term rental seeker', 'Interested in purchasing property',
  'Open to rent-to-own', 'Flexible lease terms', 'Corporate housing needed',
  'Family-friendly housing', 'Student accommodation',
];

const TRANSPORTATION_TAGS = [
  'Need motorcycle rental', 'Looking to buy motorcycle', 'Bicycle enthusiast',
  'Need yacht charter', 'Interested in yacht purchase', 'Daily commuter', 'Weekend explorer',
];

const LIFESTYLE_TAGS = [
  'Pet-friendly required', 'Eco-conscious living', 'Digital nomad', 'Fitness & wellness focused',
  'Beach lover', 'City center preference', 'Quiet neighborhood', 'Social & community-oriented',
  'Work-from-home setup', 'Minimalist lifestyle',
];

const FINANCIAL_TAGS = [
  'Verified income', 'Excellent credit score', 'Landlord references available',
  'Long-term employment', 'Flexible budget',
];

// Helper to filter tags by category
function filterTagsByCategory(allTags: string[], categoryTags: string[]): string[] {
  return allTags.filter(tag => categoryTags.includes(tag));
}

interface ClientInsightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ClientProfile | null;
}

export function ClientInsightsDialog({ open, onOpenChange, profile }: ClientInsightsDialogProps) {
  const navigate = useNavigate();
  const startConversation = useStartConversation();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Calculate client statistics based on profile completeness
  // Must be called before any early returns to follow React hooks rules
  const clientStats = useMemo(() => {
    if (!profile) return null;
    const completeness = getProfileCompleteness(profile);
    const interestCount = (profile.interests?.length || 0) + (profile.preferred_activities?.length || 0);

    return {
      profileViews: Math.max(5, Math.round(completeness * 5)), // Scale: 5-500 based on completeness
      ownerLikes: Math.max(1, Math.round(interestCount * 2)), // Scale: 1-50 based on interests
      responseRate: completeness >= 80 ? 95 : Math.round(completeness * 0.9), // 0-95% based on completeness
      averageResponseTime: '1-2 hours' // Standard response time
    };
  }, [profile]);

  // Calculate renter readiness and activity insights
  const renterInsights = useMemo(() => {
    if (!profile) return null;
    const completeness = getProfileCompleteness(profile);
    const interestCount = (profile.interests?.length || 0) + (profile.preferred_activities?.length || 0);
    const hasPhotos = (profile.profile_images?.length || 0) > 0;
    const photoCount = profile.profile_images?.length || 0;

    // Renter readiness score (0-100)
    let readinessScore = 0;
    if (profile.name) readinessScore += 15;
    if (profile.age) readinessScore += 10;
    if (hasPhotos) readinessScore += 20;
    if (photoCount >= 3) readinessScore += 10;
    if (interestCount >= 3) readinessScore += 15;
    if (interestCount >= 6) readinessScore += 10;
    if (profile.verified) readinessScore += 20;

    // Activity level
    let activityLevel: 'very_active' | 'active' | 'moderate' | 'new' = 'new';
    if (readinessScore >= 80) activityLevel = 'very_active';
    else if (readinessScore >= 60) activityLevel = 'active';
    else if (readinessScore >= 40) activityLevel = 'moderate';

    // Derive property preferences from interests
    const allTags = [...(profile.interests || []), ...(profile.preferred_activities || [])];
    const allTagsLower = allTags.map(t => t.toLowerCase());

    const wantsLongTerm = allTagsLower.some(tag => tag.includes('long-term') || tag.includes('rent'));
    const wantsShortTerm = allTagsLower.some(tag => tag.includes('short-term'));
    const needsPetFriendly = allTagsLower.some(tag => tag.includes('pet'));
    const prefersFurnished = allTagsLower.some(tag => tag.includes('furnished') || tag.includes('corporate'));
    const isDigitalNomad = allTagsLower.some(tag => tag.includes('digital nomad') || tag.includes('remote'));
    const needsFamily = allTagsLower.some(tag => tag.includes('family'));
    const isStudent = allTagsLower.some(tag => tag.includes('student'));
    const needsQuiet = allTagsLower.some(tag => tag.includes('quiet'));
    const isBeachLover = allTagsLower.some(tag => tag.includes('beach'));
    const needsCityCenter = allTagsLower.some(tag => tag.includes('city center'));
    const isFitnessOriented = allTagsLower.some(tag => tag.includes('fitness') || tag.includes('wellness') || tag.includes('gym'));
    const isEcoConscious = allTagsLower.some(tag => tag.includes('eco') || tag.includes('sustainable'));
    const needsMotorcycle = allTagsLower.some(tag => tag.includes('motorcycle'));
    const needsBicycle = allTagsLower.some(tag => tag.includes('bicycle') || tag.includes('bike'));
    const needsYacht = allTagsLower.some(tag => tag.includes('yacht') || tag.includes('boat'));

    // Calculate match potential (how good a renter they would be)
    let matchPotential = readinessScore;
    if (profile.verified) matchPotential += 10;
    if (photoCount >= 2) matchPotential += 5;
    if (interestCount >= 5) matchPotential += 5;
    matchPotential = Math.min(100, matchPotential);

    // Is this a hot prospect?
    const isHotProspect = readinessScore >= 75 && activityLevel === 'very_active';

    return {
      readinessScore: Math.min(100, readinessScore),
      activityLevel,
      photoCount,
      interestCount,
      wantsLongTerm,
      wantsShortTerm,
      needsPetFriendly,
      prefersFurnished,
      isDigitalNomad,
      needsFamily,
      isStudent,
      needsQuiet,
      isBeachLover,
      needsCityCenter,
      isFitnessOriented,
      isEcoConscious,
      needsMotorcycle,
      needsBicycle,
      needsYacht,
      matchPotential,
      isHotProspect,
      completeness,
    };
  }, [profile]);

  // Memoized callback for image clicks
  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setGalleryOpen(true);
  }, []);

  // Calculate recommendation score based on profile completeness and activity
  const recommendationScore = useMemo(() => {
    if (!profile) return 0;
    return Math.min(5, Math.round(
      (getProfileCompleteness(profile) / 20) +
      ((profile.interests?.length || 0) / 5)
    ));
  }, [profile]);

  // Memoized callback for starting conversation
  const handleMessage = useCallback(async () => {
    if (!profile) return;

    setIsCreatingConversation(true);
    try {
      toast({
        title: 'Starting conversation',
        description: 'Creating a new conversation...',
      });

      const result = await startConversation.mutateAsync({
        otherUserId: profile.user_id,
        initialMessage: `Hi! I'd like to connect with you.`,
        canStartNewConversation: true,
      });

      if (result?.conversationId) {
        navigate(`/messages?conversationId=${result.conversationId}`);
        onOpenChange(false); // Close dialog
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Error starting conversation:', error);
      }
      toast({
        title: 'Could not start conversation',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingConversation(false);
    }
  }, [profile, startConversation, navigate, onOpenChange]);

  // Early return after all hooks
  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-16px)] max-w-[400px] sm:max-w-lg max-h-[70vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-3 sm:px-4 py-3 border-b shrink-0">
          <DialogTitle className="text-sm sm:text-base">Client Profile Insights</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="space-y-3 sm:space-y-4 py-3 px-3 sm:px-4 w-full max-w-full overflow-x-hidden">
            {/* Profile Photos Gallery - FIRST - Most Important */}
            {profile.profile_images && profile.profile_images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Client Photos ({profile.profile_images.length})
                </h4>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2">
                  {profile.profile_images.slice(0, 6).map((image, index) => (
                    <div
                      key={`profile-image-${image}`}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group shadow-md"
                      onClick={() => handleImageClick(index)}
                    >
                      <img
                        src={image}
                        alt={`Client photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading={index < 3 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={index === 0 ? "high" : "auto"}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {profile.profile_images.length > 6 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{profile.profile_images.length - 6} more photos
                  </p>
                )}
                <p className="text-xs text-primary text-center mt-1">Tap any photo to view full size</p>
              </motion.div>
            )}

            {/* Hot Prospect Alert */}
            {renterInsights?.isHotProspect && (
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
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">🔥 Hot Prospect!</p>
                  <p className="text-xs text-muted-foreground font-medium">Highly engaged renter - Respond quickly</p>
                </div>
              </motion.div>
            )}

            {/* Basic Info Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-gradient-to-br from-red-500/15 via-orange-500/10 to-amber-500/5 p-3 sm:p-5 rounded-xl border border-red-500/30 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg sm:text-xl font-bold break-words">{profile.name}</h3>
                    {profile.verified && (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {profile.age && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{profile.age} yrs</span>
                      </div>
                    )}
                    {profile.gender && (
                      <span className="text-muted-foreground/50">•</span>
                    )}
                    {profile.gender && (
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{profile.gender}</span>
                      </div>
                    )}
                    {(profile.location || profile.city) && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{profile.city || 'Location verified'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {/* Match Potential Badge */}
                {renterInsights && (
                  <div className={`text-center p-2.5 rounded-xl border ${
                    renterInsights.matchPotential >= 80 ? 'bg-green-500/10 border-green-500/30' :
                    renterInsights.matchPotential >= 60 ? 'bg-blue-500/10 border-blue-500/30' :
                    renterInsights.matchPotential >= 40 ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-gray-500/10 border-gray-500/30'
                  }`}>
                    <div className={`text-xl font-bold ${
                      renterInsights.matchPotential >= 80 ? 'text-green-600 dark:text-green-400' :
                      renterInsights.matchPotential >= 60 ? 'text-blue-600 dark:text-blue-400' :
                      renterInsights.matchPotential >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>{renterInsights.matchPotential}%</div>
                    <div className="text-[10px] text-muted-foreground">Match</div>
                  </div>
                )}
              </div>

              {/* Recommendation Stars */}
              <div className="flex items-center gap-2 pt-2 border-t border-red-500/10">
                <span className="text-xs font-medium text-muted-foreground">Rating:</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < recommendationScore
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {recommendationScore}/5
                </span>
              </div>
            </motion.div>

            {/* Client Statistics */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Client Statistics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-red-500/15 to-orange-500/5 p-2 sm:p-4 rounded-lg text-center border border-red-500/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm hover:scale-105"
                >
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-red-500 mb-1 sm:mb-2 drop-shadow-md" />
                  <div className="text-lg sm:text-2xl font-bold text-red-500">{clientStats.profileViews}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">Profile Views</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-gradient-to-br from-orange-500/15 to-amber-500/5 p-2 sm:p-4 rounded-lg text-center border border-orange-500/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm hover:scale-105"
                >
                  <ThumbsUp className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-orange-500 mb-1 sm:mb-2 drop-shadow-md" />
                  <div className="text-lg sm:text-2xl font-bold text-orange-500">{clientStats.ownerLikes}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">Owner Likes</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-green-500/15 to-emerald-500/5 p-2 sm:p-4 rounded-lg text-center border border-green-500/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-green-600 dark:text-green-400 mb-1 sm:mb-2 drop-shadow-md" />
                  <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{clientStats.responseRate}%</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">Response Rate</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-gradient-to-br from-blue-500/15 to-cyan-500/5 p-2 sm:p-4 rounded-lg text-center border border-blue-500/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm hover:scale-105"
                >
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-blue-600 dark:text-blue-400 mb-1 sm:mb-2 drop-shadow-md" />
                  <div className="text-base sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{clientStats.averageResponseTime}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">Avg Response</div>
                </motion.div>
              </div>
            </div>

            {/* Renter Readiness Score */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                Renter Readiness
              </h4>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-primary/15 to-purple-500/15 p-4 rounded-lg border border-primary/30 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Readiness Score</span>
                  <Badge className={`${
                    renterInsights.readinessScore >= 80 ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/20 text-green-700 dark:text-green-400 border-green-500/40' :
                    renterInsights.readinessScore >= 60 ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40' :
                    renterInsights.readinessScore >= 40 ? 'bg-gradient-to-r from-yellow-500/30 to-amber-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/40' :
                    'bg-gradient-to-r from-gray-500/30 to-gray-400/20 text-gray-700 dark:text-gray-400 border-gray-500/40'
                  } font-bold shadow-sm`}>
                    {renterInsights.readinessScore}%
                  </Badge>
                </div>
                <div className="w-full bg-muted/40 rounded-full h-3 mb-3 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${renterInsights.readinessScore}%` }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                    className={`h-3 rounded-full transition-all duration-500 shadow-md ${
                      renterInsights.readinessScore >= 80 ? 'bg-gradient-to-r from-green-500 via-green-400 to-emerald-500' :
                      renterInsights.readinessScore >= 60 ? 'bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-500' :
                      renterInsights.readinessScore >= 40 ? 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-amber-500' :
                      'bg-gradient-to-r from-gray-400 via-gray-300 to-gray-500'
                    }`}
                  />
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {renterInsights.readinessScore >= 80
                    ? '🎉 Highly prepared renter with complete profile - ready to move!'
                    : renterInsights.readinessScore >= 60
                    ? '✨ Well-prepared renter with detailed preferences.'
                    : renterInsights.readinessScore >= 40
                    ? '📝 Moderately prepared - may need more details.'
                    : '🆕 New to the platform - building their profile.'}
                </p>
              </motion.div>
            </div>

            {/* Activity Level */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Activity Level
              </h4>
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  renterInsights.activityLevel === 'very_active' ? 'bg-green-500 animate-pulse' :
                  renterInsights.activityLevel === 'active' ? 'bg-blue-500' :
                  renterInsights.activityLevel === 'moderate' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
                <div>
                  <p className="text-sm font-medium">
                    {renterInsights.activityLevel === 'very_active' ? 'Very Active' :
                     renterInsights.activityLevel === 'active' ? 'Active' :
                     renterInsights.activityLevel === 'moderate' ? 'Moderately Active' : 'New User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {renterInsights.activityLevel === 'very_active'
                      ? 'Actively searching and responsive'
                      : renterInsights.activityLevel === 'active'
                      ? 'Regularly engaged on the platform'
                      : renterInsights.activityLevel === 'moderate'
                      ? 'Occasionally active'
                      : 'Recently joined, still exploring'}
                  </p>
                </div>
              </div>
            </div>

            {/* What They're Looking For - Enhanced */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                What They're Looking For
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {renterInsights.wantsLongTerm && (
                  <div className="flex items-center gap-2 p-2.5 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Long-term Rental</span>
                  </div>
                )}
                {renterInsights.wantsShortTerm && (
                  <div className="flex items-center gap-2 p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Short-term Stay</span>
                  </div>
                )}
                {renterInsights.needsPetFriendly && (
                  <div className="flex items-center gap-2 p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <PawPrint className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Has Pet(s)</span>
                  </div>
                )}
                {renterInsights.prefersFurnished && (
                  <div className="flex items-center gap-2 p-2.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium">Prefers Furnished</span>
                  </div>
                )}
                {renterInsights.isDigitalNomad && (
                  <div className="flex items-center gap-2 p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <Zap className="w-4 h-4 text-cyan-600" />
                    <span className="text-sm font-medium">Digital Nomad</span>
                  </div>
                )}
                {renterInsights.needsFamily && (
                  <div className="flex items-center gap-2 p-2.5 bg-pink-500/10 rounded-lg border border-pink-500/20">
                    <Users className="w-4 h-4 text-pink-600" />
                    <span className="text-sm font-medium">Family Housing</span>
                  </div>
                )}
                {renterInsights.isStudent && (
                  <div className="flex items-center gap-2 p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium">Student</span>
                  </div>
                )}
                {renterInsights.needsQuiet && (
                  <div className="flex items-center gap-2 p-2.5 bg-gray-500/10 rounded-lg border border-gray-500/20">
                    <Home className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">Quiet Area</span>
                  </div>
                )}
                {renterInsights.isBeachLover && (
                  <div className="flex items-center gap-2 p-2.5 bg-sky-500/10 rounded-lg border border-sky-500/20">
                    <span className="text-base">🏖️</span>
                    <span className="text-sm font-medium">Beach Location</span>
                  </div>
                )}
                {renterInsights.needsCityCenter && (
                  <div className="flex items-center gap-2 p-2.5 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">City Center</span>
                  </div>
                )}
                {renterInsights.isFitnessOriented && (
                  <div className="flex items-center gap-2 p-2.5 bg-red-500/10 rounded-lg border border-red-500/20">
                    <Heart className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">Fitness/Wellness</span>
                  </div>
                )}
                {renterInsights.isEcoConscious && (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <span className="text-base">🌱</span>
                    <span className="text-sm font-medium">Eco-Conscious</span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Services Needed */}
            {(renterInsights.needsMotorcycle || renterInsights.needsBicycle || renterInsights.needsYacht) && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  Additional Services Needed
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {renterInsights.needsMotorcycle && (
                    <div className="flex items-center gap-2 p-2.5 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <Car className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium">Motorcycle Rental</span>
                    </div>
                  )}
                  {renterInsights.needsBicycle && (
                    <div className="flex items-center gap-2 p-2.5 bg-green-500/10 rounded-lg border border-green-500/20">
                      <Bike className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Bicycle Rental</span>
                    </div>
                  )}
                  {renterInsights.needsYacht && (
                    <div className="flex items-center gap-2 p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                      <Anchor className="w-4 h-4 text-cyan-600" />
                      <span className="text-sm font-medium">Yacht Charter</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verification Status */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Verification Status
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                  profile.verified
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-muted/30 border-muted'
                }`}>
                  <CheckCircle className={`w-4 h-4 ${profile.verified ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <div>
                    <span className="text-sm font-medium">ID Verified</span>
                    <p className="text-xs text-muted-foreground">{profile.verified ? 'Confirmed' : 'Pending'}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                  renterInsights.photoCount >= 2
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-muted/30 border-muted'
                }`}>
                  <Eye className={`w-4 h-4 ${renterInsights.photoCount >= 2 ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <div>
                    <span className="text-sm font-medium">Photo Verified</span>
                    <p className="text-xs text-muted-foreground">{renterInsights.photoCount} photos</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                  profile.location
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-muted/30 border-muted'
                }`}>
                  <MapPin className={`w-4 h-4 ${profile.location ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <div>
                    <span className="text-sm font-medium">Location</span>
                    <p className="text-xs text-muted-foreground">{profile.location ? 'Provided' : 'Not set'}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                  renterInsights.interestCount >= 3
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-muted/30 border-muted'
                }`}>
                  <Star className={`w-4 h-4 ${renterInsights.interestCount >= 3 ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <div>
                    <span className="text-sm font-medium">Interests</span>
                    <p className="text-xs text-muted-foreground">{renterInsights.interestCount} selected</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Why This Renter - Key selling points for owner */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-green-500" />
                Why This Renter
              </h4>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="p-4 bg-gradient-to-r from-green-500/15 to-emerald-500/10 rounded-xl border border-green-500/30 shadow-lg backdrop-blur-sm"
              >
                <div className="space-y-2">
                  {profile.verified && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Identity verified - Trustworthy renter</span>
                    </div>
                  )}
                  {renterInsights.photoCount >= 2 && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Multiple photos uploaded ({renterInsights.photoCount})</span>
                    </div>
                  )}
                  {renterInsights.interestCount >= 5 && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Clear preferences defined ({renterInsights.interestCount} interests)</span>
                    </div>
                  )}
                  {renterInsights.readinessScore >= 60 && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Complete profile - Serious about renting</span>
                    </div>
                  )}
                  {renterInsights.activityLevel === 'very_active' && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Very active - Quick response expected</span>
                    </div>
                  )}
                  {renterInsights.wantsLongTerm && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Looking for long-term - Stable tenancy</span>
                    </div>
                  )}
                  {clientStats && clientStats.responseRate >= 80 && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">High response rate ({clientStats.responseRate}%)</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Recommendation Insights */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Profile Highlights
              </h4>
              <div className="bg-gradient-to-br from-red-500/10 via-orange-500/10 to-amber-500/5 p-4 rounded-lg border border-red-500/20 space-y-3">
                {recommendationScore >= 4 && (
                  <div className="flex items-start gap-2">
                    <Star className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <span className="font-semibold">Top-Rated Profile:</span> Complete profile with detailed preferences
                    </p>
                  </div>
                )}
                {(profile.interests?.length || 0) > 5 && (
                  <div className="flex items-start gap-2">
                    <Target className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <span className="font-semibold">Clear Requirements:</span> Well-defined needs make matching easier
                    </p>
                  </div>
                )}
                {(profile.profile_images?.length || 0) > 2 && (
                  <div className="flex items-start gap-2">
                    <Eye className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <span className="font-semibold">Photo Verified:</span> Multiple profile photos uploaded
                    </p>
                  </div>
                )}
                {renterInsights?.isDigitalNomad && (
                  <div className="flex items-start gap-2">
                    <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <span className="font-semibold">Digital Nomad:</span> Flexible and independent lifestyle
                    </p>
                  </div>
                )}
                {profile.age && profile.age >= 25 && profile.age <= 45 && (
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <span className="font-semibold">Working Professional:</span> Prime rental age group
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Tags by Category */}
            {((profile.interests && profile.interests.length > 0) || 
              (profile.preferred_activities && profile.preferred_activities.length > 0)) && (
              <div className="space-y-4">
                <h4 className="font-semibold">Profile Tags</h4>
                
                {/* Property Interest Tags */}
                {filterTagsByCategory([...(profile.interests || []), ...(profile.preferred_activities || [])], PROPERTY_TAGS).length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">Property & Housing</h5>
                    <div className="flex flex-wrap gap-2">
                      {filterTagsByCategory([...(profile.interests || []), ...(profile.preferred_activities || [])], PROPERTY_TAGS).map((tag) => (
                        <Badge key={`property-${tag}`} className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transportation Tags */}
                {filterTagsByCategory([...(profile.interests || []), ...(profile.preferred_activities || [])], TRANSPORTATION_TAGS).length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">Transportation & Mobility</h5>
                    <div className="flex flex-wrap gap-2">
                      {filterTagsByCategory([...(profile.interests || []), ...(profile.preferred_activities || [])], TRANSPORTATION_TAGS).map((tag) => (
                        <Badge key={`transport-${tag}`} className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lifestyle Tags */}
                {filterTagsByCategory([...(profile.interests || []), ...(profile.preferred_activities || [])], LIFESTYLE_TAGS).length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">Lifestyle & Preferences</h5>
                    <div className="flex flex-wrap gap-2">
                      {filterTagsByCategory([...(profile.interests || []), ...(profile.preferred_activities || [])], LIFESTYLE_TAGS).map((tag) => (
                        <Badge key={`lifestyle-${tag}`} className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial & Verification Tags */}
                {filterTagsByCategory([...(profile.interests || []), ...(profile.preferred_activities || [])], FINANCIAL_TAGS).length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">Financial & Verification</h5>
                    <div className="flex flex-wrap gap-2">
                      {filterTagsByCategory([...(profile.interests || []), ...(profile.preferred_activities || [])], FINANCIAL_TAGS).map((tag) => (
                        <Badge key={`financial-${tag}`} className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Insights */}
            <div>
              <h4 className="font-semibold mb-2">Profile Analysis</h4>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm">📋 Profile completeness: {getProfileCompleteness(profile)}%</p>
                <p className="text-sm">🏠 Profile tags: {(profile.interests?.length || 0) + (profile.preferred_activities?.length || 0)} selected</p>
                {profile.age && <p className="text-sm">👤 Age group: {getAgeGroup(profile.age)}</p>}
                <p className="text-sm">✍️ Profile type: {getProfileType(profile)}</p>
              </div>
            </div>

            {/* Profile Highlights */}
            <div>
              <h4 className="font-semibold mb-2">Profile Highlights</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Interests: {profile.interests?.length || 0} listed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Activities: {profile.preferred_activities?.length || 0} preferred</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Profile: {getProfileType(profile)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Location: {profile.location ? 'Specified' : 'Not set'}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button
            onClick={handleMessage}
            disabled={isCreatingConversation}
            className="w-full"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {isCreatingConversation ? 'Starting conversation...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Full-screen Image Gallery */}
      {profile.profile_images && profile.profile_images.length > 0 && (
        <PropertyImageGallery
          images={profile.profile_images}
          alt={`${profile.name}'s profile photos`}
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          initialIndex={selectedImageIndex}
        />
      )}
    </Dialog>
  );
}

// Memoize component to prevent unnecessary re-renders
export default memo(ClientInsightsDialog, (prevProps, nextProps) => {
  return (
    prevProps.profile?.user_id === nextProps.profile?.user_id &&
    prevProps.open === nextProps.open
  );
});

// Helper functions for profile analysis
function getProfileCompleteness(profile: ClientProfile): number {
  let completeness = 0;
  const fields = ['name', 'age', 'interests', 'preferred_activities', 'profile_images'];
  
  fields.forEach(field => {
    const value = profile[field as keyof ClientProfile];
    if (value) {
      if (Array.isArray(value) && value.length > 0) completeness += 1;
      else if (!Array.isArray(value)) completeness += 1;
    }
  });
  
  return Math.round((completeness / fields.length) * 100);
}

function getAgeGroup(age: number): string {
  if (age < 25) return 'Young professional';
  if (age < 35) return 'Professional';
  if (age < 50) return 'Experienced professional';
  return 'Mature professional';
}

function getProfileType(profile: ClientProfile): string {
  const allTags = [...(profile.interests || []), ...(profile.preferred_activities || [])];
  const hasProperty = allTags.some(tag => PROPERTY_TAGS.includes(tag));
  const hasTransport = allTags.some(tag => TRANSPORTATION_TAGS.includes(tag));
  const hasFinancial = allTags.some(tag => FINANCIAL_TAGS.includes(tag));
  
  if (hasProperty && hasTransport) return 'Property & Transport Seeker';
  if (hasProperty && hasFinancial) return 'Verified Property Seeker';
  if (hasProperty) return 'Property Seeker';
  if (hasTransport) return 'Transport Seeker';
  return 'General Profile';
}

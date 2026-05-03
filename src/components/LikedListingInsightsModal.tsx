import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Bed, Bath, Square, DollarSign, MessageCircle, Sparkles, Trash2, Ban, Flag, ChevronLeft, ChevronRight, X, Star, ArrowLeft, Share2, TrendingUp, CheckCircle, Home, Clock, Zap, Users, Shield, Award, ThumbsUp, Eye, Ruler, Settings, Bike, Car, Gauge, Fuel } from 'lucide-react';
import { PropertyImageGallery } from './PropertyImageGallery';
import { useNavigate } from 'react-router-dom';
import { useStartConversation } from '@/hooks/useConversations';
import { toast } from '@/components/ui/sonner';
import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/prodLogger';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CompactRatingDisplay } from './RatingDisplay';
import { RatingSubmissionDialog } from './RatingSubmissionDialog';
import { useListingRatingAggregate } from '@/hooks/useRatingSystem';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ReportDialog } from './ReportDialog';
import { ShareDialog } from './ShareDialog';

interface LikedListingInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: any | null;
}

function LikedListingInsightsModalComponent({ open, onOpenChange, listing }: LikedListingInsightsModalProps) {
  const navigate = useNavigate();
  const startConversation = useStartConversation();
  const queryClient = useQueryClient();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  // Fetch rating aggregate for this listing
  const { data: ratingAggregate } = useListingRatingAggregate(listing?.id);

  // Calculate property insights based on listing data
  const propertyInsights = useMemo(() => {
    if (!listing) return null;

    const pricePerSqft = listing.square_footage && listing.price
      ? Math.round(listing.price / listing.square_footage)
      : null;

    const amenityCount = listing.amenities?.length || 0;
    const imageCount = (listing.images?.length || 0);

    // Calculate listing quality score (0-100)
    let qualityScore = 0;
    if (listing.description && listing.description.length > 100) qualityScore += 20;
    if (imageCount >= 5) qualityScore += 25;
    else if (imageCount >= 3) qualityScore += 15;
    else if (imageCount >= 1) qualityScore += 5;
    if (amenityCount >= 8) qualityScore += 20;
    else if (amenityCount >= 4) qualityScore += 10;
    if (listing.furnished) qualityScore += 10;
    if (listing.pet_friendly) qualityScore += 10;
    if (listing.square_footage) qualityScore += 5;
    if (listing.beds && listing.baths) qualityScore += 10;

    // Value rating based on price per sqft (simplified)
    let valueRating: 'excellent' | 'good' | 'fair' | 'premium' = 'good';
    if (pricePerSqft) {
      if (pricePerSqft < 15) valueRating = 'excellent';
      else if (pricePerSqft < 25) valueRating = 'good';
      else if (pricePerSqft < 40) valueRating = 'fair';
      else valueRating = 'premium';
    }

    // Determine category
    const category = listing.category || 'property';
    const isWorker = category === 'worker' || category === 'services';
    const isMotorcycle = category === 'motorcycle';
    const isBicycle = category === 'bicycle';
    const isVehicle = isMotorcycle || isBicycle;
    const isProperty = !isVehicle && !isWorker;
    
    // Calculate demand level
    const demandLevel = qualityScore >= 80 ? 'high' : qualityScore >= 50 ? 'medium' : 'low';

    // Listing urgency
    const isHotListing = qualityScore >= 75 && listing.status === 'available';

    return {
      pricePerSqft,
      qualityScore: Math.min(100, qualityScore),
      valueRating,
      amenityCount,
      imageCount,
      responseRate: Math.min(95, 70 + amenityCount * 2),
      avgResponseTime: amenityCount > 5 ? '< 1 hour' : '1-2 hours',
      category,
      isWorker,
      isMotorcycle,
      isBicycle,
      isVehicle,
      isProperty,
      demandLevel,
      isHotListing,
    };
  }, [listing]);

  const images = listing?.images || [];

  // Reset image index when modal opens or listing changes
  useEffect(() => {
    if (open) {
      setCurrentImageIndex(0);
    }
  }, [open]);

  // Delete mutation - Remove from liked properties
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user || !listing) throw new Error('Not authenticated');

      // SCHEMA: target_id = listing ID, target_type = 'listing'
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq("user_id", user.user.id)
        .eq("target_id", listing?.id)
        .eq("target_type", "listing");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked-properties'] });
      toast({
        title: 'Removed from favorites',
        description: 'Property removed from your liked list.',
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove property from liked list.',
        variant: 'destructive',
      });
    }
  });

  // Block mutation - Block the owner of this listing
  const blockMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user || !listing?.owner_id) throw new Error('Not authenticated or no owner');

      // Insert block record
      const { error: blockError } = await supabase
        .from('user_blocks')
        .insert({
          blocker_id: user.user.id,
          blocked_id: listing.owner_id
        });

      if (blockError && !blockError.message.includes('duplicate')) {
        logger.error('Block error:', blockError);
        throw blockError;
      }

      // Also remove from likes - SCHEMA: target_id, target_type
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.user.id)
        .eq('target_id', listing.id)
        .eq('target_type', 'listing');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked-properties'] });
      toast({
        title: 'Owner blocked',
        description: 'You will no longer see listings from this owner.',
      });
      setShowBlockDialog(false);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to block owner.',
        variant: 'destructive',
      });
    }
  });



  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  const handleBlock = () => {
    setShowBlockDialog(true);
  };

  const handleConfirmBlock = () => {
    blockMutation.mutate();
  };

  const handleReport = () => {
    setShowReportDialog(true);
  };


  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = () => {
    if (images.length > 0) {
      setGalleryOpen(true);
    }
  };

  // Memoized callback to start conversation
  const handleMessage = useCallback(async () => {
    if (!listing?.owner_id) {
      toast({
        title: 'Error',
        description: 'Property owner information not available',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingConversation(true);
    try {
      toast({
        title: 'Starting conversation',
        description: 'Creating a new conversation...',
      });

      const result = await startConversation.mutateAsync({
        otherUserId: listing.owner_id,
        listingId: listing.id,
        initialMessage: `Hi! I'm interested in your property: ${listing.title}. Could you tell me more about it?`,
        canStartNewConversation: true,
      });

      if (result?.conversationId) {
        navigate(`/messages?conversationId=${result.conversationId}`);
        onOpenChange(false);
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
  }, [listing, startConversation, navigate, onOpenChange]);

  if (!listing) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-full max-w-lg h-[92dvh] max-h-[92dvh] p-0 overflow-hidden bg-[#0a0a0f] border-0 rounded-[2.5rem]"
          hideCloseButton
        >
          <div className="flex flex-col h-full relative">
            {/* Floating nav buttons */}
            <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Back"
                className="pointer-events-auto w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all backdrop-blur-xl border border-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="pointer-events-auto w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all backdrop-blur-xl border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hero Image */}
            <div className="relative flex-shrink-0">
              {images.length > 0 ? (
                <div className="relative h-[44vw] max-h-[280px] min-h-[200px] w-full overflow-hidden rounded-t-[2.5rem]">
                  <img
                    src={images[currentImageIndex]}
                    alt={`Property photo ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={handleImageClick}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/20 to-transparent pointer-events-none" />

                  {images.length > 1 && (
                    <>
                      <button onClick={handlePrevImage} aria-label="Previous Image"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/10 active:scale-90 transition-all">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={handleNextImage} aria-label="Next Image"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/10 active:scale-90 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Dot indicators */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                      {images.slice(0, 8).map((_: any, idx: number) => (
                        <button key={idx} onClick={() => setCurrentImageIndex(idx)} aria-label={`Image ${idx + 1}`}
                          className={`rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Status badges */}
                  <div className="absolute bottom-8 left-4 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EB4898]/90 backdrop-blur-md">
                      <Sparkles className="w-3 h-3 text-white" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Liked</span>
                    </div>
                    {propertyInsights?.isHotListing && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-md">
                        <Zap className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Hot</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-[11px] font-black text-white">{ratingAggregate?.displayed_rating?.toFixed(1) || '5.0'}</span>
                      <span className="text-[10px] text-white/50">({ratingAggregate?.total_ratings || 0})</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[200px] w-full bg-[#1a1a2e] rounded-t-[2.5rem] flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-white/20" />
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-5 pt-4 pb-6 space-y-5">
                {/* Title & Location */}
                <div>
                  <h2 className="text-[22px] font-black text-white leading-tight tracking-tight">{listing.title}</h2>
                  {listing.address && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                      <span className="text-[12px] text-white/50 font-medium">{listing.address}</span>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center p-3 bg-[#EB4898]/[0.1] rounded-2xl border border-[#EB4898]/20">
                    <DollarSign className="w-4 h-4 text-[#EB4898] mb-1" />
                    <span className="text-[15px] font-black text-[#EB4898]">${(listing.price || 0).toLocaleString()}</span>
                    <span className="text-[9px] text-white/30 uppercase font-black tracking-wider mt-0.5">/ mo</span>
                  </div>
                  {listing.beds ? (
                    <div className="flex flex-col items-center p-3 bg-blue-500/[0.08] rounded-2xl border border-blue-500/20">
                      <Bed className="w-4 h-4 text-blue-400 mb-1" />
                      <span className="text-[15px] font-black text-white">{listing.beds}</span>
                      <span className="text-[9px] text-white/30 uppercase font-black tracking-wider mt-0.5">beds</span>
                    </div>
                  ) : <div />}
                  {listing.baths ? (
                    <div className="flex flex-col items-center p-3 bg-purple-500/[0.08] rounded-2xl border border-purple-500/20">
                      <Bath className="w-4 h-4 text-purple-400 mb-1" />
                      <span className="text-[15px] font-black text-white">{listing.baths}</span>
                      <span className="text-[9px] text-white/30 uppercase font-black tracking-wider mt-0.5">baths</span>
                    </div>
                  ) : <div />}
                  {listing.square_footage ? (
                    <div className="flex flex-col items-center p-3 bg-orange-500/[0.08] rounded-2xl border border-orange-500/20">
                      <Square className="w-4 h-4 text-orange-400 mb-1" />
                      <span className="text-[15px] font-black text-white">{listing.square_footage}</span>
                      <span className="text-[9px] text-white/30 uppercase font-black tracking-wider mt-0.5">sqft</span>
                    </div>
                  ) : propertyInsights?.isVehicle && listing.year ? (
                    <div className="flex flex-col items-center p-3 bg-orange-500/[0.08] rounded-2xl border border-orange-500/20">
                      <Clock className="w-4 h-4 text-orange-400 mb-1" />
                      <span className="text-[15px] font-black text-white">{listing.year}</span>
                      <span className="text-[9px] text-white/30 uppercase font-black tracking-wider mt-0.5">year</span>
                    </div>
                  ) : <div />}
                </div>

                {/* Description */}
                {listing.description && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">About</h4>
                    <p className="text-[13px] leading-relaxed text-white/70 font-medium">{listing.description}</p>
                  </div>
                )}

                {/* Tags */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Details</h4>
                  <div className="flex flex-wrap gap-2">
                    {listing.property_type && (
                      <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] font-black text-blue-400 uppercase tracking-wide">{listing.property_type}</span>
                    )}
                    {listing.furnished && (
                      <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] font-black text-purple-400 uppercase tracking-wide">{listing.furnished}</span>
                    )}
                    {listing.pet_friendly && (
                      <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] font-black text-rose-400 uppercase tracking-wide">Pet Friendly</span>
                    )}
                    {listing.status && (
                      <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide",
                        listing.status === 'available'
                          ? 'bg-violet-500/10 border border-violet-500/20 text-violet-400'
                          : 'bg-white/5 border border-white/10 text-white/40'
                      )}>{listing.status}</span>
                    )}
                    {propertyInsights?.demandLevel === 'high' && (
                      <span className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] font-black text-red-400 uppercase tracking-wide">High Demand</span>
                    )}
                  </div>
                </div>

                {/* Market Insights */}
                {propertyInsights && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Market Insights</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/[0.07]">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[10px] text-white/40 uppercase font-black">Quality Score</span>
                        </div>
                        <div className="text-lg font-black text-white">{propertyInsights.qualityScore}%</div>
                      </div>
                      <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/[0.07]">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-[10px] text-white/40 uppercase font-black">Resp. Rate</span>
                        </div>
                        <div className="text-lg font-black text-white">{propertyInsights.responseRate}%</div>
                      </div>
                      {propertyInsights.pricePerSqft && (
                        <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/[0.07]">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] text-white/40 uppercase font-black">Per Sqft</span>
                          </div>
                          <div className="text-lg font-black text-white">${propertyInsights.pricePerSqft}</div>
                        </div>
                      )}
                      <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/[0.07]">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[10px] text-white/40 uppercase font-black">Avg Response</span>
                        </div>
                        <div className="text-sm font-black text-white">{propertyInsights.avgResponseTime}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Value Assessment */}
                {propertyInsights && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Value Assessment</h4>
                    <div className={cn(
                      "p-4 rounded-2xl border backdrop-blur-md",
                      propertyInsights.valueRating === 'excellent' ? 'bg-emerald-500/5 border-emerald-500/20' :
                      propertyInsights.valueRating === 'good' ? 'bg-blue-500/5 border-blue-500/20' :
                      propertyInsights.valueRating === 'fair' ? 'bg-amber-500/5 border-amber-500/20' :
                      'bg-[#EB4898]/5 border-[#EB4898]/20'
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        {propertyInsights.valueRating === 'excellent' ? <Award className="w-4 h-4 text-emerald-400" /> :
                         propertyInsights.valueRating === 'good' ? <ThumbsUp className="w-4 h-4 text-blue-400" /> :
                         propertyInsights.valueRating === 'fair' ? <CheckCircle className="w-4 h-4 text-amber-400" /> :
                         <Sparkles className="w-4 h-4 text-[#EB4898]" />}
                        <span className={cn(
                          "text-[12px] font-black uppercase tracking-wider",
                          propertyInsights.valueRating === 'excellent' ? 'text-emerald-400' :
                          propertyInsights.valueRating === 'good' ? 'text-blue-400' :
                          propertyInsights.valueRating === 'fair' ? 'text-amber-400' :
                          'text-[#EB4898]'
                        )}>
                          {propertyInsights.valueRating === 'excellent' ? 'Excellent Value' :
                           propertyInsights.valueRating === 'good' ? 'Good Value' :
                           propertyInsights.valueRating === 'fair' ? 'Fair Price' :
                           'Premium Choice'}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                        {propertyInsights.valueRating === 'excellent'
                          ? 'Exceptional value for this location. Highly recommended.'
                          : propertyInsights.valueRating === 'good'
                          ? 'Competitive pricing compared to similar listings in this area.'
                          : propertyInsights.valueRating === 'fair'
                          ? 'Fair market pricing based on current trends and amenities.'
                          : 'Premium selection offering high-end features and prime placement.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {listing.amenities && listing.amenities.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Amenities</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {listing.amenities.map((amenity: string) => (
                        <span key={`amenity-${amenity}`} className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-white/60">{amenity}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Rating & Reviews</h4>
                  <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.07]">
                    <CompactRatingDisplay aggregate={ratingAggregate || null} showReviews={true} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRatingDialog(true)}
                      className="mt-3 w-full rounded-xl bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Rate this Property
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Action Dock */}
            <div className="flex-shrink-0 px-4 pb-5 pt-3 border-t border-white/[0.06] bg-[#0d0d14]/95 backdrop-blur-xl space-y-2.5">
              <Button
                onClick={handleMessage}
                disabled={isCreatingConversation || !listing}
                className="w-full h-13 bg-gradient-to-r from-[#EB4898] to-[#FF4D00] hover:brightness-110 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-[#EB4898]/20 border-0 active:scale-[0.98] transition-all"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {isCreatingConversation ? 'Starting...' : 'Message Owner'}
              </Button>

              <div className="grid grid-cols-4 gap-2">
                <Button onClick={() => setShowShareDialog(true)} variant="ghost" size="sm"
                  className="h-10 bg-blue-500/[0.07] hover:bg-blue-500/[0.15] border border-blue-500/20 text-blue-400 rounded-xl text-[11px] font-black uppercase tracking-wide">
                  <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
                </Button>
                <Button onClick={handleDelete} variant="ghost" size="sm"
                  className="h-10 bg-red-500/[0.07] hover:bg-red-500/[0.15] border border-red-500/20 text-red-400 rounded-xl text-[11px] font-black uppercase tracking-wide"
                  disabled={deleteMutation.isPending}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                </Button>
                <Button onClick={handleBlock} variant="ghost" size="sm"
                  className="h-10 bg-orange-500/[0.07] hover:bg-orange-500/[0.15] border border-orange-500/20 text-orange-400 rounded-xl text-[11px] font-black uppercase tracking-wide"
                  disabled={blockMutation.isPending}>
                  <Ban className="w-3.5 h-3.5 mr-1.5" /> Block
                </Button>
                <Button onClick={handleReport} variant="ghost" size="sm"
                  className="h-10 bg-amber-500/[0.07] hover:bg-amber-500/[0.15] border border-amber-500/20 text-amber-400 rounded-xl text-[11px] font-black uppercase tracking-wide">
                  <Flag className="w-3.5 h-3.5 mr-1.5" /> Report
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>

        {/* Full Screen Image Gallery */}
        {images.length > 0 && (
          <PropertyImageGallery
            images={images}
            alt={listing.title}
            isOpen={galleryOpen}
            onClose={() => setGalleryOpen(false)}
            initialIndex={currentImageIndex}
          />
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Remove from Liked Properties
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this property from your liked list? You can always like it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-orange-500" />
              Block Owner
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block this owner? You will no longer see their listings, and they won't be able to see your profile. This action can be reversed in settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBlock}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
            >
              {blockMutation.isPending ? 'Blocking...' : 'Block Owner'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report and Share Dialogs */}
      {listing && (
        <>
          <ReportDialog
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            reportedListingId={listing.id}
            reportedUserId={listing.owner_id}
            reportedListingTitle={listing.title}
            category="listing"
          />
          <ShareDialog
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
            listingId={listing.id}
            title={listing.title}
            description={listing.description}
          />
        </>
      )}

      {/* Rating Submission Dialog */}
      {listing && (
        <RatingSubmissionDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          targetId={listing.id}
          targetType="listing"
          targetName={listing.title || 'This Property'}
          categoryId="property"
          onSuccess={() => {
            toast({
              title: 'Rating submitted',
              description: 'Thank you for your feedback!',
            });
            queryClient.invalidateQueries({ queryKey: ['rating-aggregate', listing.id] });
          }}
        />
      )}
    </>
  );
}

// Memoize component to prevent unnecessary re-renders
export const LikedListingInsightsModal = memo(LikedListingInsightsModalComponent, (prevProps, nextProps) => {
  return (
    prevProps.listing?.id === nextProps.listing?.id &&
    prevProps.open === nextProps.open
  );
});



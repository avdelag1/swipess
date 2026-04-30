import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Bed, Bath, Square, DollarSign, MessageCircle, Sparkles, Trash2, Ban, Flag, ChevronLeft, ChevronRight, X, Star, ArrowLeft } from 'lucide-react';
import { PropertyImageGallery } from './PropertyImageGallery';
import { useNavigate } from 'react-router-dom';
import { useStartConversation } from '@/hooks/useConversations';
import { toast } from '@/components/ui/sonner';
import { useState, useEffect, useCallback, memo } from 'react';
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
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  // Fetch rating aggregate for this listing
  const { data: ratingAggregate } = useListingRatingAggregate(listing?.id);

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

  // Report mutation
  const reportMutation = useMutation({
    mutationFn: async ({ reason, details }: { reason: string; details: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user || !listing?.owner_id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: user.user.id,
          reported_user_id: listing.owner_id,
          report_reason: reason,
          report_details: details,
          status: 'pending'
        });

      if (error) {
        logger.error('Report submission error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Report submitted',
        description: "We'll review it shortly.",
      });
      setShowReportDialog(false);
      setReportReason('');
      setReportDetails('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit report.',
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

  const handleSubmitReport = () => {
    if (!reportReason) {
      toast({
        title: 'Error',
        description: 'Please select a reason for your report.',
        variant: 'destructive',
      });
      return;
    }
    reportMutation.mutate({ reason: reportReason, details: reportDetails });
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
                  <div className="absolute bottom-8 left-4 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EB4898]/90 backdrop-blur-md">
                      <Sparkles className="w-3 h-3 text-white" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Liked</span>
                    </div>
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
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-white/5 border border-white/10 text-white/40'
                      )}>{listing.status}</span>
                    )}
                  </div>
                </div>

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

              <div className="grid grid-cols-3 gap-2">
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
                  className="h-10 bg-amber-500/[0.07] hover:bg-amber-500/[0.15] border border-amber-500/20 text-amber-400 rounded-xl text-[11px] font-black uppercase tracking-wide"
                  disabled={reportMutation.isPending}>
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

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">Report Property/Owner</h3>
            </div>
            <div className="space-y-3">
              <Label>Reason for report</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fake_listing" id="fake_listing" />
                  <Label htmlFor="fake_listing" className="font-normal">Fake or misleading listing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inappropriate" id="inappropriate" />
                  <Label htmlFor="inappropriate" className="font-normal">Inappropriate content</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scam" id="scam" />
                  <Label htmlFor="scam" className="font-normal">Suspected scam</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="discrimination" id="discrimination" />
                  <Label htmlFor="discrimination" className="font-normal">Discrimination</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal">Other</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Additional details (optional)</Label>
              <Textarea
                id="details"
                placeholder="Please provide any additional information..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="min-h-[100px] rounded-xl"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowReportDialog(false)} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={!reportReason || reportMutation.isPending}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl"
              >
                {reportMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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



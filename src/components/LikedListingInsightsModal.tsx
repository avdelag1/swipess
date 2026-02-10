import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Bed, Bath, Square, DollarSign, MessageCircle, Sparkles, Trash2, Ban, Flag, ChevronLeft, ChevronRight, X, Star } from 'lucide-react';
import { PropertyImageGallery } from './PropertyImageGallery';
import { useNavigate } from 'react-router-dom';
import { useStartConversation } from '@/hooks/useConversations';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback, memo } from 'react';
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
        .eq('user_id', user.user.id)
        .eq('target_id', listing.id)
        .eq('target_type', 'listing');

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
          className="w-full max-w-2xl h-[90vh] max-h-[90vh] p-0 overflow-hidden bg-background border-0 rounded-3xl"
          hideCloseButton
        >
          <div className="flex flex-col h-full">
            {/* Hero Image Section */}
            <div className="relative flex-shrink-0">
              {images.length > 0 ? (
                <div className="relative aspect-[16/10] w-full">
                  <img
                    src={images[currentImageIndex]}
                    alt={`Property photo ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={handleImageClick}
                  />

                  {/* Close Button */}
                  <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all backdrop-blur-sm z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all backdrop-blur-sm"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all backdrop-blur-sm"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Photo Counter & Badges */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 px-3 py-1">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Liked
                      </Badge>
                      {/* Rating Badge */}
                      <Badge className="bg-black/60 text-white border-0 px-3 py-1 backdrop-blur-sm">
                        <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                        {ratingAggregate?.displayed_rating?.toFixed(1) || '5.0'}
                        <span className="text-white/70 ml-1">({ratingAggregate?.total_ratings || 0})</span>
                      </Badge>
                    </div>
                    {images.length > 1 && (
                      <div className="bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {images.length > 1 && (
                    <div className="absolute bottom-[-28px] left-0 right-0 flex justify-center gap-1.5 px-4 z-20">
                      {images.slice(0, 8).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`h-1.5 rounded-full transition-all duration-200 ${
                            idx === currentImageIndex
                              ? 'w-6 bg-primary'
                              : 'w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/60'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/10] w-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No images</span>
                </div>
              )}
            </div>

            {/* Content Section - Scrollable */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 sm:p-6 space-y-4 pt-8 pb-6">
                {/* Title & Address */}
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold leading-tight">{listing.title}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{listing.address}</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center p-3 bg-green-500/10 rounded-xl">
                    <DollarSign className="w-5 h-5 text-green-500 mb-1" />
                    <span className="text-lg font-bold text-green-500">${listing.price?.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">per month</span>
                  </div>
                  {listing.beds && (
                    <div className="flex flex-col items-center p-3 bg-blue-500/10 rounded-xl">
                      <Bed className="w-5 h-5 text-blue-500 mb-1" />
                      <span className="text-lg font-bold">{listing.beds}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">beds</span>
                    </div>
                  )}
                  {listing.baths && (
                    <div className="flex flex-col items-center p-3 bg-purple-500/10 rounded-xl">
                      <Bath className="w-5 h-5 text-purple-500 mb-1" />
                      <span className="text-lg font-bold">{listing.baths}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">baths</span>
                    </div>
                  )}
                  {listing.square_footage && (
                    <div className="flex flex-col items-center p-3 bg-orange-500/10 rounded-xl">
                      <Square className="w-5 h-5 text-orange-500 mb-1" />
                      <span className="text-lg font-bold">{listing.square_footage}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">sqft</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {listing.description && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">About</h4>
                    <p className="text-sm leading-relaxed">{listing.description}</p>
                  </div>
                )}

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {listing.property_type && (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0">
                        {listing.property_type}
                      </Badge>
                    )}
                    {listing.furnished && (
                      <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-0">
                        Furnished
                      </Badge>
                    )}
                    {listing.pet_friendly && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-0">
                        Pet Friendly
                      </Badge>
                    )}
                    <Badge variant="secondary" className={`border-0 ${
                      listing.status === 'available'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {listing.status}
                    </Badge>
                  </div>
                </div>

                {/* Amenities */}
                {listing.amenities && listing.amenities.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {listing.amenities.map((amenity: string) => (
                        <Badge key={`amenity-${amenity}`} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating Section */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Rating & Reviews</h4>
                  <div className="p-4 bg-muted/30 rounded-xl">
                    <CompactRatingDisplay aggregate={ratingAggregate || null} showReviews={true} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRatingDialog(true)}
                      className="mt-3 w-full rounded-xl"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Rate this Property
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Action Buttons - Fixed at Bottom */}
            <div className="flex-shrink-0 p-4 border-t bg-background/80 backdrop-blur-sm space-y-3">
              {/* Primary Action */}
              <Button
                onClick={handleMessage}
                disabled={isCreatingConversation || !listing}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-base rounded-xl shadow-lg shadow-blue-500/25"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {isCreatingConversation ? 'Starting...' : 'Message Owner'}
              </Button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  size="sm"
                  className="h-10 bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400 rounded-xl"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete
                </Button>
                <Button
                  onClick={handleBlock}
                  variant="outline"
                  size="sm"
                  className="h-10 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-600 dark:text-orange-400 rounded-xl"
                  disabled={blockMutation.isPending}
                >
                  <Ban className="w-4 h-4 mr-1.5" />
                  Block
                </Button>
                <Button
                  onClick={handleReport}
                  variant="outline"
                  size="sm"
                  className="h-10 bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-600 dark:text-yellow-400 rounded-xl"
                  disabled={reportMutation.isPending}
                >
                  <Flag className="w-4 h-4 mr-1.5" />
                  Report
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

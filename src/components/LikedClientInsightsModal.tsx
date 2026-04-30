import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, User, Calendar, MessageCircle, CheckCircle, Trash2, Ban, Flag, ChevronLeft, ChevronRight, X, Briefcase, Sparkles, Star, Share2 } from 'lucide-react';
import { PropertyImageGallery } from './PropertyImageGallery';
import { useNavigate } from 'react-router-dom';
import { useStartConversation } from '@/hooks/useConversations';
import { toast } from '@/components/ui/sonner';
import { useState, useEffect, useCallback, memo } from 'react';
import { logger } from '@/utils/prodLogger';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CompactRatingDisplay } from './RatingDisplay';
import { RatingSubmissionDialog } from './RatingSubmissionDialog';
import { useUserRatingAggregate } from '@/hooks/useRatingSystem';
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

interface LikedClient {
  id: string;
  user_id: string;
  full_name: string;
  name: string;
  age: number;
  bio: string;
  profile_images: string[];
  images: string[];
  location: any;
  liked_at: string;
  occupation?: string;
  nationality?: string;
  interests?: string[];
  monthly_income?: string;
  verified?: boolean;
  gender?: string;
  city?: string;
}

interface LikedClientInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: LikedClient | null;
}

function LikedClientInsightsModalComponent({ open, onOpenChange, client }: LikedClientInsightsModalProps) {
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

  // Fetch rating aggregate for this client
  const { data: ratingAggregate } = useUserRatingAggregate(client?.user_id);

  const clientImages = client?.profile_images || client?.images || [];

  // Reset image index when modal opens
  useEffect(() => {
    if (open) {
      setCurrentImageIndex(0);
    }
  }, [open]);

  // Delete mutation - Remove from liked clients
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user || !client) throw new Error('Not authenticated');

      // Use likes table for owner → client likes (target_type = profile)
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.user.id)
        .eq('target_id', client.user_id)
        .eq('target_type', 'profile');

      if (error) throw error;

      // Return user ID for cache invalidation
      return user.user.id;
    },
    onSuccess: (userId) => {
      // FIXED: Include user ID in query key to match LikedClients query key
      queryClient.invalidateQueries({ queryKey: ['liked-clients', userId] });
      toast({
        title: 'Client removed',
        description: 'Client removed from your liked list.',
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove client from liked list.',
        variant: 'destructive',
      });
    }
  });

  // Block mutation
  const blockMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user || !client) throw new Error('Not authenticated');

      const { error: blockError } = await supabase
        .from('user_blocks')
        .insert({
          blocker_id: user.user.id,
          blocked_id: client.user_id
        });

      if (blockError && !blockError.message.includes('duplicate')) {
        logger.error('Block error:', blockError);
        throw blockError;
      }

      // Also remove from likes table
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.user.id)
        .eq('target_id', client.user_id)
        .eq('target_type', 'profile');

      // Return user ID for cache invalidation
      return user.user.id;
    },
    onSuccess: (userId) => {
      // FIXED: Include user ID in query key to match LikedClients query key
      queryClient.invalidateQueries({ queryKey: ['liked-clients', userId] });
      toast({
        title: 'Client blocked',
        description: 'Client blocked successfully.',
      });
      setShowBlockDialog(false);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to block client.',
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
    setCurrentImageIndex((prev) => (prev === 0 ? clientImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === clientImages.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = () => {
    if (clientImages.length > 0) {
      setGalleryOpen(true);
    }
  };

  const handleMessage = useCallback(async () => {
    if (!client) return;

    setIsCreatingConversation(true);
    try {
      toast({
        title: 'Starting conversation',
        description: 'Creating a new conversation...',
      });

      const result = await startConversation.mutateAsync({
        otherUserId: client.user_id,
        initialMessage: `Hi ${client.name}! I'd like to connect with you.`,
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
  }, [client, startConversation, navigate, onOpenChange]);

  if (!client) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-full max-w-lg h-[92dvh] max-h-[92dvh] p-0 overflow-hidden bg-[#0a0a0f] border-0 rounded-[2.5rem]"
          hideCloseButton
        >
          <div className="flex flex-col h-full">
            {/* Floating nav buttons */}
            <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Back"
                className="pointer-events-auto w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all backdrop-blur-xl border border-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
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
              {clientImages.length > 0 ? (
                <div className="relative h-[50vw] max-h-[320px] min-h-[220px] w-full overflow-hidden rounded-t-[2.5rem]">
                  <img
                    src={clientImages[currentImageIndex]}
                    alt={`${client.name} photo ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={handleImageClick}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/10 to-transparent pointer-events-none" />

                  {clientImages.length > 1 && (
                    <>
                      <button onClick={handlePrevImage} aria-label="Previous image"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/10 active:scale-90 transition-all">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={handleNextImage} aria-label="Next image"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/10 active:scale-90 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {clientImages.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                      {clientImages.slice(0, 8).map((_, idx) => (
                        <button key={idx} onClick={() => setCurrentImageIndex(idx)} aria-label={`Image ${idx + 1}`}
                          className={`rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute bottom-8 left-4 flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EB4898]/90 backdrop-blur-md">
                      <Sparkles className="w-3 h-3 text-white" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Liked</span>
                    </div>
                    {client.verified && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/80 backdrop-blur-md">
                        <CheckCircle className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Verified</span>
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
                <div className="h-[220px] w-full bg-[#1a1a2e] rounded-t-[2.5rem] flex items-center justify-center">
                  <User className="w-16 h-16 text-white/10" />
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 relative flex flex-col">
              <ScrollArea className="h-full w-full">
                <div className="px-5 pt-4 pb-6 space-y-5">

                  {/* Name & info */}
                  <div>
                    <h2 className="text-[22px] font-black text-white leading-tight tracking-tight flex items-center gap-2">
                      {client.name}
                      {client.verified && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {client.age && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-white/30" />
                          <span className="text-[12px] text-white/50 font-medium">{client.age} yrs</span>
                        </div>
                      )}
                      {client.gender && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-white/30" />
                          <span className="text-[12px] text-white/50 font-medium">{client.gender}</span>
                        </div>
                      )}
                      {(client.location || client.city) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-white/30" />
                          <span className="text-[12px] text-white/50 font-medium">{client.city || 'Location verified'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Occupation */}
                  {client.occupation && (
                    <div className="flex items-center gap-3 p-4 bg-blue-500/[0.07] rounded-2xl border border-blue-500/15">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/35 uppercase font-black tracking-widest mb-0.5">Occupation</p>
                        <p className="text-[14px] font-bold text-white">{client.occupation}</p>
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {client.bio && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">About</h4>
                      <p className="text-[13px] leading-relaxed text-white/70 font-medium">{client.bio}</p>
                    </div>
                  )}

                  {/* Interests */}
                  {client.interests && client.interests.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Interests</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {client.interests.map((interest) => (
                          <span key={`interest-${interest}`}
                            className="px-3 py-1.5 rounded-xl bg-[#EB4898]/[0.08] border border-[#EB4898]/20 text-[11px] font-bold text-[#EB4898]/90">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
                      client.verified
                        ? 'bg-emerald-500/[0.07] border-emerald-500/20'
                        : 'bg-white/[0.03] border-white/[0.07]'
                    }`}>
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${client.verified ? 'text-emerald-400' : 'text-white/20'}`} />
                      <div>
                        <p className="text-[12px] font-black text-white">ID Verified</p>
                        <p className="text-[10px] text-white/35">{client.verified ? 'Confirmed' : 'Pending'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 bg-white/[0.03] rounded-2xl border border-white/[0.07]">
                      <MapPin className="w-5 h-5 text-white/20 flex-shrink-0" />
                      <div>
                        <p className="text-[12px] font-black text-white">Photos</p>
                        <p className="text-[10px] text-white/35">{clientImages.length} uploaded</p>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Rating & Reviews</h4>
                    <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.07]">
                      <CompactRatingDisplay aggregate={ratingAggregate || null} showReviews={true} />
                      <Button variant="outline" size="sm" onClick={() => setShowRatingDialog(true)}
                        className="mt-3 w-full rounded-xl bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20">
                        <Star className="w-4 h-4 mr-2" />
                        Rate this Client
                      </Button>
                    </div>
                  </div>

                  <div className="text-[10px] text-white/20 font-medium">
                    Connected {new Date(client.liked_at).toLocaleDateString()}
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Action Dock */}
            <div className="flex-shrink-0 px-4 pb-5 pt-3 border-t border-white/[0.06] bg-[#0d0d14]/95 backdrop-blur-xl z-20 space-y-2.5">
              <Button
                onClick={handleMessage}
                disabled={isCreatingConversation || !client}
                className="w-full h-13 bg-gradient-to-r from-[#EB4898] to-[#FF4D00] hover:brightness-110 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-[#EB4898]/20 border-0 active:scale-[0.98] transition-all"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {isCreatingConversation ? 'Starting...' : 'Send Message'}
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

        {/* Full-screen Image Gallery */}
        {clientImages.length > 0 && (
          <PropertyImageGallery
            images={clientImages}
            alt={`${client?.name}'s profile photos`}
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
              Remove from Liked Clients
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {client?.name} from your liked clients? You can always like them again later.
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
              Block Client
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block {client?.name}? This will remove them from your liked clients and prevent any future interactions. This action can be reversed in settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBlock}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
            >
              {blockMutation.isPending ? 'Blocking...' : 'Block Client'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report and Share Dialogs */}
      {client && (
        <>
          <ReportDialog
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            targetId={client.user_id}
            targetType="user_profile"
            reportedUserId={client.user_id}
            targetName={client.name}
          />
          <ShareDialog
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
            profileId={client.user_id}
            title={client.name}
            description={client.bio}
          />
        </>
      )}

      {/* Rating Submission Dialog */}
      {client && (
        <RatingSubmissionDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          targetId={client.user_id}
          targetType="user"
          targetName={client.name || 'This Client'}
          categoryId="client"
          onSuccess={() => {
            toast({
              title: 'Rating submitted',
              description: 'Thank you for your feedback!',
            });
            queryClient.invalidateQueries({ queryKey: ['rating-aggregate', client.user_id] });
          }}
        />
      )}
    </>
  );
}

// Memoize component to prevent unnecessary re-renders
export const LikedClientInsightsModal = memo(LikedClientInsightsModalComponent, (prevProps, nextProps) => {
  return (
    prevProps.client?.id === nextProps.client?.id &&
    prevProps.open === nextProps.open
  );
});



import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Users, ArrowLeft, Trash2, Home, Flame, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useStartConversation } from "@/hooks/useConversations";
import { useMessagingQuota } from "@/hooks/useMessagingQuota";
import { logger } from "@/utils/prodLogger";
import { MessageQuotaDialog } from "@/components/MessageQuotaDialog";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface InterestedOwner {
  id: string;
  owner_id: string;
  owner_name: string;
  business_name: string | null;
  listing_title: string | null;
  listing_id: string | null;
  created_at: string;
  is_super_like: boolean;
}

const ClientWhoLikedYou = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<InterestedOwner | null>(null);
  const queryClient = useQueryClient();
  const startConversation = useStartConversation();
  const { canStartNewConversation } = useMessagingQuota();

  // Fetch owners who liked this client
  const { data: interestedOwners = [], isLoading, refetch, isFetching } = useQuery<InterestedOwner[]>({
    queryKey: ['client-who-liked-you', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all likes where client was liked (target_type='profile', direction='like')
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('id, user_id, created_at')
        .eq('target_id', user.id)
        .eq('target_type', 'profile')
        .eq('direction', 'like')
        .order('created_at', { ascending: false });

      if (likesError) {
        logger.error('[ClientWhoLikedYou] Error fetching likes:', likesError);
        throw likesError;
      }

      if (!likes || likes.length === 0) return [];

      // Get unique owner IDs
      const ownerIds = [...new Set(likes.map(l => l.user_id))];

      // Fetch owner profiles
      const { data: ownerProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', ownerIds);

      if (profilesError) {
        logger.error('[ClientWhoLikedYou] Error fetching profiles:', profilesError);
      }

      const profileMap = new Map((ownerProfiles || []).map((p: { id: string; full_name: string | null }) => [p.id, p]));

      return likes.map(like => {
        const profile = profileMap.get(like.user_id);
        return {
          id: like.id,
          owner_id: like.user_id,
          owner_name: profile?.full_name || 'Property Owner',
          business_name: null,
          listing_title: null,
          listing_id: null,
          created_at: like.created_at,
          is_super_like: false,
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 30000,
    gcTime: 60000,
  });

  // Delete like mutation
  const deleteLikeMutation = useMutation({
    mutationFn: async (likeId: string) => {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', likeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-who-liked-you'] });
      queryClient.invalidateQueries({ queryKey: ['client-stats'] });
      toast.success("Removed from your likes");
      setShowDeleteDialog(false);
      setSelectedOwner(null);
    },
    onError: () => {
      toast.error("Failed to remove");
    }
  });

  const handleOpenMessageDialog = (owner: InterestedOwner) => {
    setSelectedOwner(owner);

    if (!canStartNewConversation) {
      setShowQuotaDialog(true);
      return;
    }

    setShowMessageDialog(true);
  };

  const handleStartConversation = async () => {
    if (!selectedOwner || isCreatingConversation) return;

    setIsCreatingConversation(true);

    try {
      toast.loading('Starting conversation...', { id: 'start-conv' });

      const result = await startConversation.mutateAsync({
        otherUserId: selectedOwner.owner_id,
        initialMessage: `Hi ${selectedOwner.owner_name}! Thanks for showing interest in my profile. I'd love to connect!`,
        canStartNewConversation: true,
      });

      if (result?.conversationId) {
        toast.success('Opening chat...', { id: 'start-conv' });
        setShowMessageDialog(false);
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (error) {
      logger.error('Error starting conversation:', error);
      toast.error('Could not start conversation', { id: 'start-conv' });
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleOpenDeleteDialog = (owner: InterestedOwner) => {
    setSelectedOwner(owner);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedOwner) return;
    deleteLikeMutation.mutate(selectedOwner.id);
  };

  // Filter by search term
  const filteredOwners = interestedOwners.filter(owner => {
    const matchesSearch =
      owner.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.listing_title?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="w-full bg-background">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl pb-24 sm:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white flex-shrink-0">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Who Liked You</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  See property owners interested in you
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/client/liked-properties')}
              variant="outline"
              className="gap-2 whitespace-nowrap"
            >
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">My Liked Properties</span>
              <span className="sm:hidden">My Likes</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search by name or listing..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 h-10 sm:h-11"
              />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium">{filteredOwners.length} interested</span>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-32 bg-muted rounded mb-3"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        ) : filteredOwners.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 sm:py-16 max-w-md mx-auto"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-muted flex items-center justify-center">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">No Likes Yet</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">
              {searchTerm ? 'No owners match your search.' : 'When property owners like your profile, they\'ll appear here'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => navigate('/client/dashboard')}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-sm sm:text-base"
              >
                Browse Properties
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredOwners.map((owner, index) => (
                <motion.div
                  key={owner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                    {/* Super Like Badge */}
                    {owner.is_super_like && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-current" />
                        <span>Super</span>
                      </div>
                    )}

                    {/* Owner Info - NO PHOTO (Privacy) */}
                    <div className="mb-4">
                      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                        <span className="text-2xl font-bold">
                          {owner.owner_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-center mb-1">
                        {owner.owner_name}
                      </h3>
                      {owner.business_name && (
                        <p className="text-sm text-muted-foreground text-center truncate">
                          {owner.business_name}
                        </p>
                      )}
                    </div>

                    {/* Listing Info if available */}
                    {owner.listing_title && (
                      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">Related to listing:</p>
                            <p className="text-sm font-medium truncate">{owner.listing_title}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Privacy Notice */}
                    <div className="mb-4 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                        Full profile visible after matching
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleOpenMessageDialog(owner)}
                        disabled={isCreatingConversation}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        size="sm"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                      <Button
                        onClick={() => handleOpenDeleteDialog(owner)}
                        variant="outline"
                        size="sm"
                        className="px-3"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    {/* Liked Date */}
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground text-center">
                        Liked on {new Date(owner.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Message Quota Dialog */}
      <MessageQuotaDialog
        isOpen={showQuotaDialog}
        onClose={() => setShowQuotaDialog(false)}
        onUpgrade={() => {
          setShowQuotaDialog(false);
          navigate('/subscription-packages');
        }}
        userRole="client"
      />

      {/* Message Confirmation Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              Start Conversation
            </DialogTitle>
            <DialogDescription>
              Start a conversation with {selectedOwner?.owner_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm">
              <strong>Owner:</strong> {selectedOwner?.owner_name}
            </p>
            {selectedOwner?.business_name && (
              <p className="text-sm">
                <strong>Business:</strong> {selectedOwner.business_name}
              </p>
            )}
            {selectedOwner?.listing_title && (
              <p className="text-sm">
                <strong>Related Listing:</strong> {selectedOwner.listing_title}
              </p>
            )}
            {selectedOwner?.is_super_like && (
              <div className="mt-3 p-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg border border-amber-500/20">
                <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <Heart className="w-4 h-4 fill-current" />
                  This owner super liked you!
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartConversation}
              disabled={isCreatingConversation}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {isCreatingConversation ? "Starting..." : "Start Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Remove Like
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedOwner?.owner_name}'s like?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteLikeMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientWhoLikedYou;

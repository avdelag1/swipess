import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOwnerInterestedClients, InterestedClient } from "@/hooks/useOwnerInterestedClients";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Users, ArrowLeft, Trash2, MapPin, Home, X, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
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

interface ExtendedInterestedClient extends InterestedClient {
  user_details?: {
    age?: number;
    occupation?: string;
    bio?: string;
    location?: any;
  };
  mutual?: boolean;
}

const OwnerInterestedClients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ExtendedInterestedClient | null>(null);
  const queryClient = useQueryClient();
  const startConversation = useStartConversation();
  const { canStartNewConversation } = useMessagingQuota();

  const { data: fetchedRole } = useUserRole(user?.id);
  const userRole = fetchedRole || 'owner';

  // Fetch interested clients
  const { data: interestedClients = [], isLoading, refetch, isFetching } = useOwnerInterestedClients();

  // Fetch additional user details for each interested client
  const { data: extendedClients = [] } = useQuery<ExtendedInterestedClient[]>({
    queryKey: ['interested-clients-extended', interestedClients.map(c => c.user.id)],
    queryFn: async () => {
      if (!interestedClients.length) return [];

      const userIds = [...new Set(interestedClients.map(c => c.user.id))];

      // Fetch profile details - use columns that exist
      const { data: profiles, error } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, city, avatar_url')
        .in('id', userIds);

      if (error) {
        logger.error('[OwnerInterestedClients] Error fetching profiles:', error);
        return interestedClients;
      }

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      // Check for mutual likes (if owner also liked these clients using likes table)
      const { data: ownerLikes } = await supabase
        .from('likes')
        .select('target_id')
        .eq('user_id', user?.id)
        .eq('target_type', 'profile')
        .in('target_id', userIds);

      const mutualSet = new Set((ownerLikes || []).map(ol => ol.target_id));

      return interestedClients.map(client => {
        const profile = profileMap.get(client.user.id) as any;
        return {
          ...client,
          user_details: profile ? {
            full_name: profile.full_name,
            city: profile.city,
            avatar_url: profile.avatar_url,
          } : undefined,
          mutual: mutualSet.has(client.user.id),
        };
      });
    },
    enabled: interestedClients.length > 0,
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
      queryClient.invalidateQueries({ queryKey: ['owner-interested-clients'] });
      toast.success("Client removed from interested list");
      setShowDeleteDialog(false);
      setSelectedClient(null);
    },
    onError: () => {
      toast.error("Failed to remove client");
    }
  });

  const handleOpenMessageDialog = (client: ExtendedInterestedClient) => {
    setSelectedClient(client);

    // Check if user can start conversation
    if (!canStartNewConversation) {
      setShowQuotaDialog(true);
      return;
    }

    setShowMessageDialog(true);
  };

  const handleStartConversation = async () => {
    if (!selectedClient || isCreatingConversation) return;

    setIsCreatingConversation(true);

    try {
      toast.loading('Starting conversation...', { id: 'start-conv' });

      const result = await startConversation.mutateAsync({
        otherUserId: selectedClient.user.id,
        initialMessage: `Hi ${selectedClient.user.full_name}! I noticed you're interested in my listing "${selectedClient.listing.title}". Let's chat!`,
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

  const handleOpenDeleteDialog = (client: ExtendedInterestedClient) => {
    setSelectedClient(client);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedClient) return;
    deleteLikeMutation.mutate(selectedClient.id);
  };

  // Filter by search term
  const filteredClients = extendedClients.filter(client => {
    const matchesSearch =
      client.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.user_details?.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.user_details?.bio?.toLowerCase().includes(searchTerm.toLowerCase());

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
                  See who's interested in your listings
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/owner/liked-clients')}
              variant="outline"
              className="gap-2 whitespace-nowrap"
            >
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">My Liked Clients</span>
              <span className="sm:hidden">My Likes</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search by name, listing, or occupation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 h-10 sm:h-11"
              />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium">{filteredClients.length} interested</span>
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
        ) : filteredClients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 sm:py-16 max-w-md mx-auto"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-muted flex items-center justify-center">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">No Interested Clients Yet</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">
              {searchTerm ? 'No clients match your search.' : 'When clients like your listings, they\'ll appear here'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => navigate('/owner/dashboard')}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-sm sm:text-base"
              >
                View My Listings
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                    {/* Mutual Like Badge */}
                    {client.mutual && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-current" />
                        <span>Mutual</span>
                      </div>
                    )}

                    {/* User Info - NO PHOTO */}
                    <div className="mb-4">
                      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                        <span className="text-2xl font-bold">
                          {client.user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-center mb-1">
                        {client.user.full_name}
                      </h3>
                      {client.user_details?.age && (
                        <p className="text-sm text-muted-foreground text-center">
                          {client.user_details.age} years old
                        </p>
                      )}
                      {client.user_details?.occupation && (
                        <p className="text-sm text-muted-foreground text-center truncate">
                          {client.user_details.occupation}
                        </p>
                      )}
                    </div>

                    {/* Listing Info */}
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Home className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">Interested in:</p>
                          <p className="text-sm font-medium truncate">{client.listing.title}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bio Preview */}
                    {client.user_details?.bio && (
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {client.user_details.bio}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleOpenMessageDialog(client)}
                        disabled={isCreatingConversation}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        size="sm"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                      <Button
                        onClick={() => handleOpenDeleteDialog(client)}
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
                        Liked on {new Date(client.created_at).toLocaleDateString()}
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
        userRole={userRole}
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
              Start a conversation with {selectedClient?.user.full_name} about your listing "{selectedClient?.listing.title}"?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm">
              <strong>Name:</strong> {selectedClient?.user.full_name}
            </p>
            {selectedClient?.user_details?.age && (
              <p className="text-sm">
                <strong>Age:</strong> {selectedClient.user_details.age} years old
              </p>
            )}
            {selectedClient?.user_details?.occupation && (
              <p className="text-sm">
                <strong>Occupation:</strong> {selectedClient.user_details.occupation}
              </p>
            )}
            <p className="text-sm">
              <strong>Interested in:</strong> {selectedClient?.listing.title}
            </p>
            {selectedClient?.mutual && (
              <div className="mt-3 p-2 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-lg border border-pink-500/20">
                <p className="text-sm text-pink-700 dark:text-pink-300 flex items-center gap-2">
                  <Heart className="w-4 h-4 fill-current" />
                  You both liked each other! This is a mutual match.
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
              Remove Interested Client
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedClient?.user.full_name} from your interested clients list?
              They liked your listing "{selectedClient?.listing.title}".
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

export default OwnerInterestedClients;

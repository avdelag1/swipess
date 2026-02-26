import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Users, ArrowLeft, Trash2, Home, Flame, MapPin, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useStartConversation } from "@/hooks/useConversations";
import { PageHeader } from "@/components/PageHeader";
import { PremiumLikedCard } from "@/components/PremiumLikedCard";
import { cn } from "@/lib/utils";
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

const OwnerInterestedClients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<any>(null);
  const queryClient = useQueryClient();
  const startConversation = useStartConversation();

  const { data: interestedClients = [], isLoading } = useQuery({
    queryKey: ['owner-interested-clients', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all listings owned by this owner
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title')
        .eq('owner_id', user.id);

      const listingIds = listings?.map(l => l.id) || [];
      if (listingIds.length === 0) return [];

      // Get likes on those listings
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .in('target_id', listingIds)
        .eq('target_type', 'listing')
        .eq('direction', 'right')
        .order('created_at', { ascending: false });

      if (likesError) throw likesError;
      if (!likes || likes.length === 0) return [];

      const clientIds = likes.map(l => l.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', clientIds);

      if (profilesError) throw profilesError;

      return profiles.map(profile => {
        const like = likes.find(l => l.user_id === profile.user_id);
        const listing = listings?.find(l => l.id === like?.target_id);
        return {
          ...profile,
          id: profile.user_id,
          user_id: profile.user_id,
          liked_listing: listing?.title,
          category: 'Applicant',
          created_at: like?.created_at
        };
      });
    },
    enabled: !!user?.id,
  });

  const removeLikeMutation = useMutation({
    mutationFn: async (clientId: string) => {
      // Fetch this owner's listing IDs so we can delete the correct like records
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('owner_id', user?.id);

      const listingIds = listings?.map(l => l.id) || [];
      if (listingIds.length === 0) return;

      const { error } = await supabase.from('likes').delete()
        .eq('user_id', clientId)
        .in('target_id', listingIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-interested-clients', user?.id] });
      toast.success("Client dismissed");
      setShowDeleteDialog(false);
    }
  });

  const handleAction = async (action: 'message' | 'view' | 'remove', client: any) => {
    if (action === 'remove') {
      setClientToDelete(client);
      setShowDeleteDialog(true);
      return;
    }

    if (action === 'view') {
      navigate(`/owner/view-client/${client.user_id}`);
      return;
    }

    if (action === 'message') {
      try {
        const result = await startConversation.mutateAsync({
          otherUserId: client.user_id,
          initialMessage: `Hi ${client.full_name}! Thanks for liking my listing. Let's talk!`,
          canStartNewConversation: true
        });
        if (result?.conversationId) navigate(`/messages?conversationId=${result.conversationId}`);
      } catch (error) {
        toast.error("Unable to start conversation");
      }
    }
  };

  const filteredClients = interestedClients.filter(c =>
    (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full pb-32 bg-background min-h-screen">
      <div className="p-4 pt-[calc(56px+var(--safe-top)+1rem)] sm:p-8 sm:pt-[calc(56px+var(--safe-top)+2rem)] max-w-7xl mx-auto">
        <PageHeader
          title="Interested Clients"
          subtitle="People who loved your listings"
          showBack={true}
          actions={
            <div className="px-4 py-2 rounded-2xl bg-[#E4007C]/10 border border-[#E4007C]/20 text-[#E4007C] text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(228,0,124,0.1)]">
              <Sparkles className="w-4 h-4" />
              Top Demand
            </div>
          }
        />

        <div className="relative mb-10 pt-4">
          <input
            placeholder="Filter interested clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-16 bg-muted border border-border rounded-3xl pl-6 text-foreground font-bold outline-none focus:border-[#E4007C] transition-all"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-96 rounded-[2.5rem] bg-zinc-900/50 animate-pulse" />)}
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredClients.map((client) => (
                <PremiumLikedCard
                  key={client.id}
                  type="profile"
                  data={client}
                  onAction={(action) => handleAction(action, client)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/20 rounded-[3rem] border border-white/5">
            <Heart className="w-12 h-12 text-[#E4007C]/40 mb-6" />
            <h3 className="text-white font-black text-2xl tracking-tighter">Attraction Imminent.</h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed font-bold">When someone likes your listings, they'll appear here for you to connect.</p>
          </motion.div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-950 border-white/10 rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-black text-xl">Dismiss Interest?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 font-bold">This client will be removed from your interested list.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-white/5 text-white rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => clientToDelete && removeLikeMutation.mutate(clientToDelete.user_id)} className="bg-[#E4007C] text-white rounded-xl font-black">DISMISS</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OwnerInterestedClients;

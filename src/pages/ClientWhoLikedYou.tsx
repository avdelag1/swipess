import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Users, ArrowLeft, Trash2, Home, Flame, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useStartConversation } from "@/hooks/useConversations";
import { useMessagingQuota } from "@/hooks/useMessagingQuota";
import { logger } from "@/utils/prodLogger";
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

interface InterestedOwner {
  id: string;
  owner_id: string;
  owner_name: string;
  bio: string | null;
  images: string[];
  created_at: string;
  is_super_like: boolean;
  category?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  age?: number | null;
  occupation?: string | null;
  verified?: boolean;
}

const ClientWhoLikedYou = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<InterestedOwner | null>(null);
  const queryClient = useQueryClient();
  const startConversation = useStartConversation();

  const { data: interestedOwners = [] as InterestedOwner[], isLoading } = useQuery({
    queryKey: ['client-who-liked-you', user?.id],
    queryFn: async (): Promise<InterestedOwner[]> => {
      if (!user?.id) return [];
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .eq('target_id', user.id)
        .eq('target_type', 'profile')
        .eq('direction', 'like')
        .order('created_at', { ascending: false });

      if (likesError) throw likesError;
      if (!likes || likes.length === 0) return [];

      const ownerIds = likes.map(l => l.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', ownerIds);

      if (profilesError) throw profilesError;

      return (profiles || []).map(profile => {
        const like = likes.find(l => l.user_id === profile.user_id);
        return {
          ...profile,
          id: profile.user_id,
          owner_id: profile.user_id,
          owner_name: profile.full_name || 'Owner',
          created_at: like?.created_at || new Date().toISOString(),
          category: 'Interviewer',
          is_super_like: (like as any)?.direction === 'super_like' || false,
          images: (profile as any).images || [],
          bio: profile.bio || null
        } as InterestedOwner;
      });
    },
    enabled: !!user?.id,
  });

  const removeLikeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('likes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-who-liked-you', user?.id] });
      toast.success("Connection dismissed");
      setShowDeleteDialog(false);
    }
  });

  const handleAction = async (action: 'message' | 'view' | 'remove', owner: any) => {
    if (action === 'remove') {
      setOwnerToDelete(owner);
      setShowDeleteDialog(true);
      return;
    }

    if (action === 'view') {
      navigate(`/profile/${owner.owner_id}`);
      return;
    }

    if (action === 'message') {
      try {
        const result = await startConversation.mutateAsync({
          otherUserId: owner.owner_id,
          initialMessage: `Hi! I saw you were interested in my profile. Let's connect!`,
          canStartNewConversation: true
        });
        if (result?.conversationId) navigate(`/messages?conversationId=${result.conversationId}`);
      } catch (error) {
        toast.error("Unable to start conversation");
      }
    }
  };

  const filteredOwners = interestedOwners.filter(o =>
    (o.owner_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full pb-32 bg-background min-h-screen">
      <div className="p-4 pt-[calc(56px+var(--safe-top)+1rem)] sm:p-8 sm:pt-[calc(56px+var(--safe-top)+2rem)] max-w-7xl mx-auto">
        <PageHeader
          title="They're Interested"
          subtitle="Owners who want to meet you"
          showBack={true}
        />

        <div className="relative mb-10 pt-4">
          <input
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-16 bg-muted border border-border rounded-3xl pl-6 text-foreground font-bold outline-none focus:border-[#E4007C] transition-all"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-96 rounded-[2.5rem] bg-zinc-900/50 animate-pulse" />)}
          </div>
        ) : filteredOwners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredOwners.map((owner) => (
                <PremiumLikedCard
                  key={owner.id}
                  type="profile"
                  data={owner}
                  onAction={(action) => handleAction(action, owner)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/20 rounded-[3rem] border border-white/5">
            <Heart className="w-12 h-12 text-[#E4007C]/40 mb-6" />
            <h3 className="text-white font-black text-2xl tracking-tighter">Stay Noticed.</h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed font-bold">When an owner likes your profile, they will appear here instantly.</p>
          </motion.div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-950 border-white/10 rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-black text-xl">Dismiss Interest?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 font-bold">This will remove their profile from your interest list.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-white/5 text-white rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => ownerToDelete && removeLikeMutation.mutate(ownerToDelete.id)} className="bg-[#E4007C] text-white rounded-xl font-black">DISMISS</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientWhoLikedYou;

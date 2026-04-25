import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, Sparkles, Home, Briefcase, DollarSign, Flame, GripVertical } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LikesSkeleton } from "@/components/ui/LikesSkeleton";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PremiumSortableGrid } from "@/components/PremiumSortableGrid";
import { toast } from "sonner";
import { useStartConversation } from "@/hooks/useConversations";
import { PremiumLikedCard } from "@/components/PremiumLikedCard";
import { pwaImagePreloader, getCardImageUrl } from "@/utils/imageOptimization";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
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
import { usePersistentReorder } from "@/hooks/usePersistentReorder";
import useAppTheme from "@/hooks/useAppTheme";

const clientCategories = [
  { id: "all", label: "All", icon: Flame },
  { id: "renter", label: "Renters", icon: Home },
  { id: "worker", label: "Workers", icon: Briefcase },
  { id: "buyer", label: "Buyers", icon: DollarSign },
];

const OwnerInterestedClients = () => {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ user_id: string } | null>(null);
  const queryClient = useQueryClient();
  const startConversation = useStartConversation();

  const storageKey = user?.id ? `interested-clients-order-${user.id}` : "";

  const { data: interestedClients = [], isLoading } = useQuery({
    queryKey: ["owner-interested-clients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: listings } = await supabase
        .from("listings")
        .select("id, title")
        .eq("owner_id", user.id);

      const listingIds = listings?.map((l) => l.id) || [];
      if (listingIds.length === 0) return [];

      const { data: likes, error: likesError } = await supabase
        .from("likes")
        .select("*")
        .in("target_id", listingIds)
        .eq("target_type", "listing")
        .eq("direction", "right")
        .order("created_at", { ascending: false });

      if (likesError) throw likesError;
      if (!likes || likes.length === 0) return [];

      const clientIds = likes.map((l) => l.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", clientIds)
        .neq("role", "admin");

      if (profilesError) throw profilesError;

      return profiles.map((profile) => {
        const like = likes.find((l) => l.user_id === profile.user_id);
        const listing = listings?.find((l) => l.id === like?.target_id);
        return {
          ...profile,
          id: profile.user_id,
          user_id: profile.user_id,
          liked_listing: listing?.title,
          category: "Applicant",
          created_at: like?.created_at,
        };
      });
    },
    enabled: !!user?.id,
  });

  // Realtime: refetch when a client likes/unlikes one of this owner's listings
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`owner-interested-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes', filter: 'target_type=eq.listing' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['owner-interested-clients', user.id] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // 🚀 SPEED OF LIGHT: Preload profile images instantly
  useEffect(() => {
    if (interestedClients.length > 0) {
      const urls = interestedClients
        .slice(0, 10)
        .map(c => {
          const profile = c as Record<string, any>;
          const images = profile.images || profile.profile_images || [];
          return getCardImageUrl(images[0] || profile.avatar_url);
        })
        .filter(Boolean) as string[];
      pwaImagePreloader.batchPreload(urls);
    }
  }, [interestedClients]);

  const removeLikeMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data: listings } = await supabase
        .from("listings")
        .select("id")
        .eq("owner_id", user.id);

      const listingIds = listings?.map((l) => l.id) || [];
      if (listingIds.length === 0) return;

      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", clientId)
        .in("target_id", listingIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-interested-clients", user?.id] });
      toast.success("Client dismissed");
      setShowDeleteDialog(false);
      setClientToDelete(null);
    },
  });

  const handleAction = async (action: "message" | "view" | "remove", client: any) => {
    if (action === "remove") {
      setClientToDelete(client);
      setShowDeleteDialog(true);
      return;
    }
    if (action === "view") {
      navigate(`/owner/view-client/${client.user_id}`);
      return;
    }
    if (action === "message") {
      try {
        const result = await startConversation.mutateAsync({
          otherUserId: client.user_id,
          initialMessage: `Hi ${client.full_name}! Thanks for liking my listing. Let's talk!`,
          canStartNewConversation: true,
        });
        if (result?.conversationId) navigate(`/messages?conversationId=${result.conversationId}`);
      } catch {
        toast.error("Unable to start conversation");
      }
    }
  };

  // Category + search filter (loose matching by occupation/role)
  const baseFiltered = interestedClients.filter((c) => {
    const matchesSearch = (c.full_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedCategory === "renter")
      return matchesSearch && ((c as any).role || "").toLowerCase().includes("client");
    if (selectedCategory === "worker")
      return matchesSearch && ((c as any).occupation || "").toLowerCase().includes("work");
    if (selectedCategory === "buyer")
      return matchesSearch && ((c as any).role || "").toLowerCase().includes("buyer");
    return matchesSearch;
  });

  const { orderedItems: filteredClients, handleReorder } = usePersistentReorder(
    baseFiltered,
    storageKey
  );

  return (
    <div className="w-full relative flex flex-col pb-40 min-h-screen" data-no-swipe-nav="true">
      <div className="p-4 pt-24 sm:p-8 sm:pt-24 max-w-7xl mx-auto">
        <PageHeader title="Interested Clients" subtitle="Top Demand Entities" showBack={true} />

        {/* Category filter tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide pb-2 pt-2">
          {clientCategories.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setSelectedCategory(id)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "flex items-center gap-2.5 px-6 py-3.5 rounded-3xl text-sm font-black whitespace-nowrap transition-all flex-shrink-0 border",
                selectedCategory === id
                  ? "bg-[var(--color-brand-accent-2)] border-[var(--color-brand-accent-2)] text-white shadow-[0_8px_24px_rgba(228,0,124,0.4)]"
                  : isLight
                  ? "bg-white border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary shadow-sm"
                  : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.08]"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <input
            placeholder="Search liked clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full h-14 rounded-2xl pl-6 font-bold focus:border-[var(--color-brand-accent-2)] transition-all outline-none border",
              isLight
                ? "bg-background border-border/40 text-foreground placeholder-muted-foreground shadow-sm"
                : "bg-muted border-border text-foreground placeholder-muted-foreground"
            )}
          />
        </div>

        {/* Count + drag hint */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-brand-accent-2)] shadow-[0_0_10px_var(--color-brand-accent-2)]" />
          <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
            {filteredClients.length} Potential Professionals
          </span>
          {filteredClients.length > 1 && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              <GripVertical className="w-3 h-3" />
              Drag to reorder
            </span>
          )}
        </div>

        {isLoading ? (
          <LikesSkeleton />
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" style={{ touchAction: 'pan-y' }}>
            {filteredClients.map((client: any) => (
              <div key={client.id} className="rounded-[2rem]" style={{ touchAction: 'pan-y' }}>
                <PremiumLikedCard
                  type="profile"
                  data={client}
                  onAction={(action) => handleAction(action, client)}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ThumbsUp}
            title="Attraction Imminent."
            description="When someone likes your listings, they'll appear here for you to connect."
            actionLabel="GO TO DASHBOARD"
            onAction={() => navigate("/owner/dashboard")}
          />
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-black text-xl">
              Dismiss Interest?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-bold">
              This client will be removed from your interested list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary border-border text-foreground rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clientToDelete && removeLikeMutation.mutate(clientToDelete.user_id)}
              className="bg-[var(--color-brand-accent-2)] text-white rounded-xl font-black"
            >
              DISMISS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OwnerInterestedClients;



import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, Sparkles, Home, Briefcase, DollarSign, Flame, GripVertical } from "lucide-react";
import { motion, Reorder } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useStartConversation } from "@/hooks/useConversations";
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
import { usePersistentReorder } from "@/hooks/usePersistentReorder";
import { useTheme } from "@/hooks/useTheme";

const clientCategories = [
  { id: "all", label: "All", icon: Flame },
  { id: "renter", label: "Renters", icon: Home },
  { id: "worker", label: "Workers", icon: Briefcase },
  { id: "buyer", label: "Buyers", icon: DollarSign },
];

const OwnerInterestedClients = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
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

  const removeLikeMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { data: listings } = await supabase
        .from("listings")
        .select("id")
        .eq("owner_id", user?.id ?? "");

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
    <div className="w-full pb-32 bg-background min-h-screen">
      <div className="p-4 pt-4 sm:p-8 sm:pt-4 max-w-7xl mx-auto">
        {/* Badge */}
        <div className="flex items-center justify-end mb-8 relative z-10">
          <div className="px-4 py-2 rounded-2xl bg-[var(--color-brand-accent-2)]/10 border border-[var(--color-brand-accent-2)]/20 text-[var(--color-brand-accent-2)] text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(228,0,124,0.1)]">
            <Sparkles className="w-4 h-4" />
            Top Demand
          </div>
        </div>

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
            placeholder="Filter interested clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full h-16 rounded-3xl pl-6 font-bold focus:border-[var(--color-brand-accent-2)] transition-all outline-none border",
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
            {filteredClients.length} Interested Clients
          </span>
          {filteredClients.length > 1 && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              <GripVertical className="w-3 h-3" />
              Drag to reorder
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-[2.5rem] bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          <Reorder.Group
            axis="y"
            values={filteredClients}
            onReorder={handleReorder}
            data-no-swipe-nav
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
              {filteredClients.map((client) => (
                <Reorder.Item
                  key={client.id}
                  value={client}
                  className="list-none"
                  whileDrag={{ scale: 1.03, zIndex: 50, boxShadow: "0 20px 60px rgba(228,0,124,0.25)" }}
                >
                  <PremiumLikedCard
                    type="profile"
                    data={client}
                    onAction={(action) => handleAction(action, client)}
                  />
                </Reorder.Item>
              ))}
          </Reorder.Group>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "flex flex-col items-center justify-center py-32 text-center rounded-[3rem] border",
              isLight ? "bg-muted/30 border-border/40" : "bg-muted/20 border-white/[0.06]"
            )}
          >
            <div className={cn(
              "w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl border",
              isLight ? "bg-muted border-border/30" : "bg-white/[0.04] border-white/[0.08]"
            )}>
              <ThumbsUp className="w-12 h-12 text-[var(--color-brand-accent-2)]/60 animate-pulse" />
            </div>
            <h3 className="text-foreground font-black text-2xl tracking-tighter mb-4">
              Attraction Imminent.
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed font-bold mb-10">
              When someone likes your listings, they'll appear here for you to connect.
            </p>
            <button
              onClick={() => navigate("/owner/dashboard")}
              className="px-8 py-4 rounded-2xl text-sm font-black text-white transition-all active:scale-95 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
            >
              GO TO DASHBOARD
            </button>
          </motion.div>
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
